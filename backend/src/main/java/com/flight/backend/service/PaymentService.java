package com.flight.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.flight.backend.dto.payment.PaymentResponse;
import com.flight.backend.entity.Booking;
import com.flight.backend.entity.FlightSeat;
import com.flight.backend.entity.Payment;
import com.flight.backend.entity.Ticket;
import com.flight.backend.entity.enums.BookingStatus;
import com.flight.backend.entity.enums.FlightSeatStatus;
import com.flight.backend.entity.enums.PaymentMethod;
import com.flight.backend.entity.enums.PaymentStatus;
import com.flight.backend.entity.enums.TicketStatus;
import com.flight.backend.mapper.PaymentMapper;
import com.flight.backend.repository.PaymentRepository;

import jakarta.transaction.Transactional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;

    public PaymentService(
            PaymentRepository paymentRepository,
            PaymentMapper paymentMapper) {
        this.paymentRepository = paymentRepository;
        this.paymentMapper = paymentMapper;
    }

    // Tạo bản ghi thanh toán khi khách xác nhận đã chuyển khoản.
    // amount = finalAmount (sau voucher) nếu có, ngược lại dùng totalAmount.
    public void createPayment(Booking booking, PaymentMethod paymentMethod) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        BigDecimal amount = booking.getFinalAmount() != null
                ? booking.getFinalAmount()
                : booking.getTotalAmount();
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentTime(LocalDateTime.now().plusMinutes(5));
        payment.setStatus(PaymentStatus.PENDING);

        this.paymentRepository.save(payment);
    }

    public PaymentResponse getPaymentById(Long id) {
        Payment payment = this.paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return this.paymentMapper.toResponse(payment);
    }

    @Transactional
    public PaymentResponse paymentSuccess(Long paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Update payment
        payment.setStatus(PaymentStatus.SUCCESS);

        payment.setPaymentTime(LocalDateTime.now());

        // Booking
        Booking booking = payment.getBooking();

        booking.setStatus(BookingStatus.PAID);

        // Ticket + Seat
        for (Ticket ticket : booking.getTickets()) {

            ticket.setStatus(TicketStatus.ISSUED);

            // Ghế được chọn SAU khi thanh toán -> có thể chưa có ghế tại thời điểm này
            FlightSeat seat = ticket.getFlightSeat();
            if (seat != null) {
                seat.setStatus(FlightSeatStatus.BOOKED);
            }
        }

        paymentRepository.save(payment);

        return paymentMapper.toResponse(payment);
    }
}
