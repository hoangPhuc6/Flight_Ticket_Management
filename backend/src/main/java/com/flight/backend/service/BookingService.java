package com.flight.backend.service;

import com.flight.backend.dto.booking.BookingResponse;
import com.flight.backend.dto.booking.CreateBookingRequest;
import com.flight.backend.dto.booking.MyBookingResponse;
import com.flight.backend.dto.passenger.CreatePassengerRequest;
import com.flight.backend.entity.Booking;
import com.flight.backend.entity.Flight;
import com.flight.backend.entity.FlightSeat;
import com.flight.backend.entity.Notification;
import com.flight.backend.entity.Passenger;
import com.flight.backend.entity.Payment;
import com.flight.backend.entity.Seat;
import com.flight.backend.entity.Ticket;
import com.flight.backend.entity.TicketClass;
import com.flight.backend.entity.User;
import com.flight.backend.entity.enums.BookingStatus;
import com.flight.backend.entity.enums.FlightSeatStatus;
import com.flight.backend.entity.enums.NotificationChannel;
import com.flight.backend.entity.enums.NotificationStatus;
import com.flight.backend.entity.enums.NotificationType;
import com.flight.backend.entity.enums.PaymentStatus;
import com.flight.backend.entity.enums.TicketStatus;
import com.flight.backend.mapper.BookingMapper;
import com.flight.backend.repository.BookingRepository;
import com.flight.backend.repository.NotificationRepository;
import com.flight.backend.repository.RegulationRepository;
import com.flight.backend.repository.UserRepository;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserService userService;
    private final FlightService flightService;
    private final PassengerService passengerService;
    private final TicketClassService ticketClassService;
    private final TicketService ticketService;
    private final PaymentService paymentService;
    private final FlightSeatService flightSeatService;
    private final BookingMapper bookingMapper;
    private final RegulationRepository regulationRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public BookingService(
            BookingRepository bookingRepository,
            UserService userService,
            FlightService flightService,
            PassengerService passengerService,
            TicketClassService ticketClassService,
            TicketService ticketService,
            PaymentService paymentService,
            FlightSeatService flightSeatService,
            BookingMapper bookingMapper,
            RegulationRepository regulationRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.userService = userService;
        this.flightService = flightService;
        this.passengerService = passengerService;
        this.ticketClassService = ticketClassService;
        this.ticketService = ticketService;
        this.paymentService = paymentService;
        this.flightSeatService = flightSeatService;
        this.bookingMapper = bookingMapper;
        this.regulationRepository = regulationRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }

    // Đọc quy định kiểu số nguyên theo settingKey (null nếu chưa cấu hình)
    private Integer regInt(String key) {
        return regulationRepository.findBySettingKey(key)
                .map(r -> r.getSettingValue() != null ? r.getSettingValue().intValue() : null)
                .orElse(null);
    }

    // Đọc quy định kiểu số thực theo settingKey (null nếu chưa cấu hình)
    private BigDecimal regDecimal(String key) {
        return regulationRepository.findBySettingKey(key)
                .map(com.flight.backend.entity.Regulation::getSettingValue)
                .orElse(null);
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest req, String email) {
        User customer = (email != null)
                ? userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"))
                : userService.getUserById(req.getUserId());

        Flight flight = flightService.getFlightById(req.getFlightId());

        TicketClass ticketClass = this.ticketClassService.findTicketClassById(req.getTicketClassId());

        // R06: số vé tối đa mỗi đơn theo quy định
        int passengerCount = req.getPassengers() == null ? 0 : req.getPassengers().size();
        if (passengerCount == 0) {
            throw new RuntimeException("Đơn đặt phải có ít nhất 1 hành khách.");
        }
        Integer maxTickets = regInt("max_tickets_per_booking");
        if (maxTickets != null && passengerCount > maxTickets) {
            throw new RuntimeException(
                    "Số vé vượt quá quy định (tối đa " + maxTickets + " vé mỗi đơn).");
        }

        // R07: thời gian chờ thanh toán (phút) theo quy định, mặc định 15
        Integer paymentTimeout = regInt("payment_timeout_minutes");
        int timeoutMinutes = paymentTimeout != null ? paymentTimeout : 15;

        // Tạo booking
        Booking booking = new Booking();

        booking.setCustomer(customer);
        booking.setBookingDate(LocalDateTime.now());
        booking.setFlight(flight);
        // Khách báo đã chuyển khoản -> chờ staff xác nhận
        booking.setStatus(BookingStatus.PENDING);
        booking.setPnrCode(generatePNR());
        booking.setExpirationTime(LocalDateTime.now().plusMinutes(timeoutMinutes));
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        BigDecimal totalAmount = BigDecimal.ZERO;

        booking = bookingRepository.save(booking);

        // Tạo ticket cho từng passenger
        List<Ticket> tickets = new ArrayList<>();

        for (CreatePassengerRequest pRequest : req.getPassengers()) {
            Passenger passenger = this.passengerService.createPassengerEntity(pRequest);

            // Chưa gán ghế lúc đặt — khách chọn ghế sau khi thanh toán được xác nhận
            Ticket ticket = this.ticketService.createTicketEntity(booking, passenger, null, flight, ticketClass);
            totalAmount = totalAmount.add(ticket.getPrice());
            tickets.add(ticket);
        }

        // Update total
        booking.setTotalAmount(totalAmount);
        booking.setTickets(tickets);
        bookingRepository.save(booking);

        this.paymentService.createPayment(booking);

        // Gửi thông báo cho nhân viên: có đơn mới đã báo chuyển khoản, chờ xác nhận
        createTransferNotification(booking, customer, totalAmount);

        return this.bookingMapper.toResponse(booking);
    }

    // Thông báo "khách đã chuyển khoản, chờ xác nhận" — staff xem ở /notifications,
    // khách xem ở /notifications/my
    private void createTransferNotification(Booking booking, User customer, BigDecimal amount) {
        Notification noti = new Notification();
        noti.setUser(customer);
        noti.setBooking(booking);
        noti.setType(NotificationType.BOOKING_CREATED);
        noti.setChannel(NotificationChannel.IN_APP);
        noti.setTitle("Đơn " + booking.getPnrCode() + " chờ xác nhận chuyển khoản");
        noti.setContent("Khách hàng " + (customer.getFullName() != null ? customer.getFullName() : "")
                + " đã báo chuyển khoản cho đơn " + booking.getPnrCode()
                + " (số tiền " + (amount != null ? amount.toBigInteger() : "0")
                + " VND). Vui lòng kiểm tra và xác nhận thanh toán.");
        noti.setStatus(NotificationStatus.SENT);
        noti.setSentAt(LocalDateTime.now());
        notificationRepository.save(noti);
    }

    private String generatePNR() {
        return UUID.randomUUID()
                .toString()
                .substring(0, 6)
                .toUpperCase();
    }

    public Booking getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Booking not found"));
        return booking;
    }

    @Transactional
    public BookingResponse getBookingResponse(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Booking not found"));
        return this.bookingMapper.toResponse(booking);
    }

    @Transactional
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(bookingMapper::toResponse)
                .toList();
    }

    // Danh sách vé của khách hàng đang đăng nhập (cho mục "Chuyến bay của tôi")
    @Transactional
    public List<MyBookingResponse> getMyBookings(String email) {
        User customer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return bookingRepository.findByCustomer_Id(customer.getId()).stream()
                .sorted((a, b) -> {
                    LocalDateTime da = a.getBookingDate();
                    LocalDateTime db = b.getBookingDate();
                    if (da == null) {
                        return 1;
                    }
                    if (db == null) {
                        return -1;
                    }
                    return db.compareTo(da);
                })
                .map(this::mapToMyBooking)
                .toList();
    }

    private MyBookingResponse mapToMyBooking(Booking b) {
        Flight f = b.getFlight();
        Payment p = b.getPayment();
        var route = f != null ? f.getRoute() : null;
        var airline = (f != null && f.getAirplane() != null) ? f.getAirplane().getAirline() : null;

        List<MyBookingResponse.MyBookingTicket> ticketDtos = new ArrayList<>();
        boolean seatsAssigned = b.getTickets() != null && !b.getTickets().isEmpty();
        Long purchasedClassId = null;
        String purchasedClassName = null;
        if (b.getTickets() != null) {
            for (Ticket t : b.getTickets()) {
                Seat seat = t.getFlightSeat() != null ? t.getFlightSeat().getSeat() : null;
                if (seat == null) {
                    seatsAssigned = false;
                }
                TicketClass tc = t.getTicketClass();
                if (tc != null && purchasedClassId == null) {
                    purchasedClassId = tc.getId();
                    purchasedClassName = tc.getClassName();
                }
                ticketDtos.add(MyBookingResponse.MyBookingTicket.builder()
                        .ticketId(t.getId())
                        .ticketNumber(t.getTicketNumber())
                        .passengerName(t.getPassenger() != null ? t.getPassenger().getFullName() : null)
                        .documentNumber(t.getPassenger() != null ? t.getPassenger().getDocumentNumber() : null)
                        .seatNumber(seat != null ? seat.getSeatNumber() : null)
                        .ticketClassName(tc != null ? tc.getClassName()
                                : (seat != null && seat.getTicketClass() != null
                                        ? seat.getTicketClass().getClassName()
                                        : null))
                        .status(t.getStatus() != null ? t.getStatus().name() : null)
                        .build());
            }
        }

        return MyBookingResponse.builder()
                .bookingId(b.getId())
                .pnrCode(b.getPnrCode())
                .status(b.getStatus() != null ? b.getStatus().name() : null)
                .paymentStatus(p != null && p.getStatus() != null ? p.getStatus().name() : "PENDING")
                .totalAmount(b.getTotalAmount())
                .bookingDate(b.getBookingDate())
                .flightId(f != null ? f.getId() : null)
                .airlineName(airline != null ? airline.getAirlineName() : null)
                .flightCode(f != null ? f.getFlightCode() : null)
                .departureAirportCode(route != null && route.getDepartureAirport() != null
                        ? route.getDepartureAirport().getAirportCode()
                        : null)
                .arrivalAirportCode(route != null && route.getArrivalAirport() != null
                        ? route.getArrivalAirport().getAirportCode()
                        : null)
                .departureCity(route != null && route.getDepartureAirport() != null
                        ? route.getDepartureAirport().getCity()
                        : null)
                .arrivalCity(route != null && route.getArrivalAirport() != null
                        ? route.getArrivalAirport().getCity()
                        : null)
                .departureTime(f != null ? f.getDepartureTime() : null)
                .arrivalTime(f != null ? f.getArrivalTime() : null)
                .ticketClassId(purchasedClassId)
                .ticketClassName(purchasedClassName)
                .seatsAssigned(seatsAssigned)
                .tickets(ticketDtos)
                .build();
    }

    // Staff xác nhận đã nhận được chuyển khoản -> đánh dấu thanh toán thành công và gửi vé điện tử
    @Transactional
    public BookingResponse confirmPaymentByBooking(Long bookingId) {
        Booking booking = getBookingById(bookingId);
        Payment payment = booking.getPayment();
        if (payment == null) {
            throw new RuntimeException("Đơn đặt chưa có thông tin thanh toán.");
        }
        paymentService.paymentSuccess(payment.getId());

        Booking updatedBooking = getBookingById(bookingId);
        emailService.sendETicketEmail(updatedBooking);
        return bookingMapper.toResponse(updatedBooking);
    }

    // Gửi lại vé điện tử qua email (khách hàng hoặc nhân viên)
    @Transactional
    public boolean resendETicketEmail(Long bookingId, String customerEmail) {
        Booking booking = getBookingById(bookingId);
        if (customerEmail != null) {
            User owner = booking.getCustomer();
            if (owner == null || owner.getEmail() == null
                    || !owner.getEmail().equalsIgnoreCase(customerEmail)) {
                throw new RuntimeException("Bạn không có quyền gửi lại vé của đơn đặt này.");
            }
        }
        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Chỉ có thể gửi vé điện tử cho đơn đặt đã được thanh toán.");
        }
        return emailService.sendETicketEmail(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id) {
        return cancelBooking(id, null);
    }

    // customerEmail != null: khách tự hủy -> chỉ được hủy đơn của chính mình.
    // customerEmail == null: Staff/Admin hủy hộ -> không ràng buộc quyền sở hữu.
    @Transactional
    public BookingResponse cancelBooking(Long id, String customerEmail) {
        Booking booking = getBookingById(id);

        if (customerEmail != null) {
            User owner = booking.getCustomer();
            if (owner == null || owner.getEmail() == null
                    || !owner.getEmail().equalsIgnoreCase(customerEmail)) {
                throw new RuntimeException("Bạn không có quyền hủy đơn đặt chỗ này.");
            }
        }

        if (booking.getStatus() == BookingStatus.CANCELLED
                || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new RuntimeException("Đơn đặt đã ở trạng thái không thể hủy.");
        }

        // R05: chỉ được hủy trước giờ khởi hành tối thiểu N giờ theo quy định
        Integer cancelBeforeHours = regInt("cancel_before_hours");
        LocalDateTime departure = booking.getFlight() != null ? booking.getFlight().getDepartureTime() : null;
        if (cancelBeforeHours != null && departure != null) {
            LocalDateTime deadline = departure.minusHours(cancelBeforeHours);
            if (LocalDateTime.now().isAfter(deadline)) {
                throw new RuntimeException(
                        "Không thể hủy vé: phải hủy trước giờ khởi hành tối thiểu "
                                + cancelBeforeHours + " giờ.");
            }
        }

        boolean wasPaid = booking.getStatus() == BookingStatus.PAID
                || booking.getStatus() == BookingStatus.CONFIRMED;

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());

        // R08: hoàn tiền theo tỉ lệ quy định nếu đơn đã thanh toán
        BigDecimal refundAmount = BigDecimal.ZERO;
        if (wasPaid) {
            BigDecimal refundPercent = regDecimal("refund_percent");
            BigDecimal base = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
            if (refundPercent != null) {
                refundAmount = base.multiply(refundPercent)
                        .divide(BigDecimal.valueOf(100));
            }
            Payment payment = booking.getPayment();
            if (payment != null) {
                payment.setStatus(PaymentStatus.REFUNDED);
            }
        }
        booking.setRefundAmount(refundAmount);

        // Giải phóng ghế và đánh dấu vé đã hủy/hoàn
        if (booking.getTickets() != null) {
            for (Ticket ticket : booking.getTickets()) {
                ticket.setStatus(wasPaid ? TicketStatus.REFUNDED : TicketStatus.CANCELLED);
                FlightSeat seat = ticket.getFlightSeat();
                if (seat != null) {
                    seat.setStatus(FlightSeatStatus.AVAILABLE);
                }
            }
        }

        return bookingMapper.toResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse expireBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus(BookingStatus.EXPIRED);
        booking.setUpdatedAt(LocalDateTime.now());

        return bookingMapper.toResponse(bookingRepository.save(booking));
    }
}
