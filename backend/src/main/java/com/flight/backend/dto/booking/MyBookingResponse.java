package com.flight.backend.dto.booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyBookingResponse {

    private Long bookingId;
    private String pnrCode;
    private String status;
    private String paymentStatus;

    // totalAmount: tổng tiền gốc trước giảm giá
    private BigDecimal totalAmount;
    // discountAmount: số tiền được giảm (null hoặc 0 nếu không dùng voucher)
    private BigDecimal discountAmount;
    // finalAmount: số tiền thực phải trả (= totalAmount - discountAmount); null nếu không dùng voucher
    private BigDecimal finalAmount;

    private LocalDateTime bookingDate;

    // Thông tin chuyến bay
    private Long flightId;
    private String airlineName;
    private String flightCode;
    private String departureAirportCode;
    private String arrivalAirportCode;
    private String departureCity;
    private String arrivalCity;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;

    // Hạng vé đã mua (giới hạn chọn ghế đúng hạng)
    private Long ticketClassId;
    private String ticketClassName;

    // Đã chọn ghế cho tất cả vé chưa
    private boolean seatsAssigned;

    private List<MyBookingTicket> tickets;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MyBookingTicket {
        private Long ticketId;
        private String ticketNumber;
        private String passengerName;
        private String documentNumber;
        private String seatNumber;
        private String ticketClassName;
        private String status;
    }
}
