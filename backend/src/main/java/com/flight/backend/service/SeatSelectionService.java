package com.flight.backend.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.flight.backend.entity.enums.BookingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flight.backend.dto.booking.SelectSeatsRequest;
import com.flight.backend.dto.flight.SeatOptionResponse;
import com.flight.backend.entity.Booking;
import com.flight.backend.entity.Flight;
import com.flight.backend.entity.FlightSeat;
import com.flight.backend.entity.Seat;
import com.flight.backend.entity.Ticket;
import com.flight.backend.entity.User;
import com.flight.backend.entity.enums.FlightSeatStatus;
import com.flight.backend.repository.BookingRepository;
import com.flight.backend.repository.FlightRepository;
import com.flight.backend.repository.FlightSeatRepository;
import com.flight.backend.repository.SeatRepository;

@Service
public class SeatSelectionService {

    private final FlightRepository flightRepository;
    private final SeatRepository seatRepository;
    private final FlightSeatRepository flightSeatRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    public SeatSelectionService(
            FlightRepository flightRepository,
            SeatRepository seatRepository,
            FlightSeatRepository flightSeatRepository,
            BookingRepository bookingRepository,
            EmailService emailService) {
        this.flightRepository = flightRepository;
        this.seatRepository = seatRepository;
        this.flightSeatRepository = flightSeatRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
    }

    // Sơ đồ ghế đầy đủ của chuyến bay (layout từ model máy bay + tình trạng còn trống)
    @Transactional(readOnly = true)
    public List<SeatOptionResponse> getAvailableSeats(Long flightId) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuyến bay"));

        if (flight.getAirplane() == null || flight.getAirplane().getModel() == null) {
            throw new RuntimeException("Chuyến bay chưa gắn loại máy bay (model).");
        }

        Long modelId = flight.getAirplane().getModel().getId();
        List<Seat> seats = seatRepository.findByAirplaneModelId(modelId);

        // Ghế đã bị giữ/đặt trên chuyến bay này
        Set<Long> takenSeatIds = new HashSet<>();
        for (FlightSeat fs : flightSeatRepository.findByFlightId(flightId)) {
            if (fs.getSeat() != null
                    && (fs.getStatus() == FlightSeatStatus.HELD
                            || fs.getStatus() == FlightSeatStatus.BOOKED)) {
                takenSeatIds.add(fs.getSeat().getId());
            }
        }

        return seats.stream()
                .sorted(Comparator
                        .comparing((Seat s) -> s.getRowNumber() == null ? 0 : s.getRowNumber())
                        .thenComparing(s -> s.getColumnLetter() == null ? "" : s.getColumnLetter()))
                .map(s -> SeatOptionResponse.builder()
                        .seatId(s.getId())
                        .seatNumber(s.getSeatNumber())
                        .rowNumber(s.getRowNumber())
                        .columnLetter(s.getColumnLetter())
                        .ticketClassId(s.getTicketClass() != null ? s.getTicketClass().getId() : null)
                        .ticketClassName(s.getTicketClass() != null ? s.getTicketClass().getClassName() : null)
                        .available(!takenSeatIds.contains(s.getId()))
                        .build())
                .toList();
    }

    // Gán ghế cho từng vé trong đơn
    // customerEmail != null: khách tự chọn ghế -> chỉ được chọn ghế cho đơn của chính mình.
    // customerEmail == null: Staff/Admin chọn hộ -> không ràng buộc quyền sở hữu.
    @Transactional
    public void selectSeats(Long bookingId, SelectSeatsRequest request, String customerEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt vé"));

        if (customerEmail != null) {
            User owner = booking.getCustomer();
            if (owner == null || owner.getEmail() == null
                    || !owner.getEmail().equalsIgnoreCase(customerEmail)) {
                throw new RuntimeException("Bạn không có quyền chọn ghế cho đơn đặt chỗ này.");
            }
        }

        // Chỉ được chọn ghế sau khi đơn đã được xác nhận thanh toán (PAID/CONFIRMED)
        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException(
                    "Chỉ có thể chọn ghế cho đơn đặt chỗ đã được xác nhận thanh toán.");
        }

        if (request == null || request.getAssignments() == null || request.getAssignments().isEmpty()) {
            throw new RuntimeException("Chưa chọn ghế nào.");
        }

        Flight flight = booking.getFlight();
        List<Ticket> tickets = booking.getTickets();
        Set<Long> usedInThisRequest = new HashSet<>();

        for (SelectSeatsRequest.SeatAssignment a : request.getAssignments()) {
            if (a.getTicketId() == null || a.getSeatId() == null) {
                continue;
            }

            Ticket ticket = tickets.stream()
                    .filter(t -> t.getId().equals(a.getTicketId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Vé không thuộc đơn đặt này."));

            Seat seat = seatRepository.findById(a.getSeatId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy ghế."));

            // Chỉ cho chọn ghế đúng hạng vé đã mua
            if (ticket.getTicketClass() != null && seat.getTicketClass() != null
                    && !ticket.getTicketClass().getId().equals(seat.getTicketClass().getId())) {
                throw new RuntimeException("Ghế " + seat.getSeatNumber()
                        + " không thuộc hạng vé bạn đã mua (" + ticket.getTicketClass().getClassName() + ").");
            }

            if (usedInThisRequest.contains(seat.getId())) {
                throw new RuntimeException("Ghế " + seat.getSeatNumber() + " bị chọn trùng trong cùng một lần.");
            }
            usedInThisRequest.add(seat.getId());

            // Dùng lại FlightSeat đã được sinh sẵn cho ghế này của chuyến bay (tránh trùng khóa flight_id+seat_id)
            FlightSeat target = flightSeatRepository
                    .findByFlightIdAndSeatId(flight.getId(), seat.getId())
                    .orElseGet(() -> FlightSeat.builder()
                            .flight(flight)
                            .seat(seat)
                            .status(FlightSeatStatus.AVAILABLE)
                            .build());

            boolean takenByOther = (target.getStatus() == FlightSeatStatus.HELD
                    || target.getStatus() == FlightSeatStatus.BOOKED)
                    && (target.getTicket() == null || !target.getTicket().getId().equals(ticket.getId()));
            if (takenByOther) {
                throw new RuntimeException("Ghế " + seat.getSeatNumber()
                        + " đã có người chọn, vui lòng chọn ghế khác.");
            }

            target.setStatus(FlightSeatStatus.BOOKED);
            ticket.setFlightSeat(target);
            flightSeatRepository.save(target);
        }

        // Đơn đã thanh toán (đã kiểm tra ở trên) -> gửi email vé điện tử cập nhật số ghế
        emailService.sendETicketEmail(booking);
    }
}
