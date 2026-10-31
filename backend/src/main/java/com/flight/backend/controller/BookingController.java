package com.flight.backend.controller;

import com.flight.backend.dto.ApiResponse;
import com.flight.backend.dto.booking.BookingResponse;
import com.flight.backend.dto.booking.CreateBookingRequest;
import com.flight.backend.dto.booking.MyBookingResponse;
import com.flight.backend.service.BookingService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(
            BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @RequestBody CreateBookingRequest req,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        BookingResponse resp = this.bookingService.createBooking(req, email);
        return ApiResponse.success(resp, "Tạo booking thành công");
    }

    // Vé của khách hàng đang đăng nhập
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<MyBookingResponse>>> getMyBookings(
            Authentication authentication) {
        List<MyBookingResponse> resp = this.bookingService.getMyBookings(authentication.getName());
        return ApiResponse.success(resp, "Lấy danh sách vé thành công");
    }

    // Staff xác nhận đã nhận chuyển khoản
    @PostMapping("/{id}/confirm-payment")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmPayment(@PathVariable Long id) {
        BookingResponse resp = this.bookingService.confirmPaymentByBooking(id);
        return ApiResponse.success(resp, "Xác nhận thanh toán thành công");
    }

    // Gửi lại vé điện tử qua email
    @PostMapping("/{id}/send-email")
    public ResponseEntity<ApiResponse<String>> resendETicketEmail(
            @PathVariable Long id,
            Authentication authentication) {
        boolean isStaffOrAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_STAFF"));
        String customerEmail = (!isStaffOrAdmin && authentication != null) ? authentication.getName() : null;
        boolean sent = this.bookingService.resendETicketEmail(id, customerEmail);
        if (sent) {
            return ApiResponse.success("OK", "Vé điện tử đã được gửi tới email của quý khách thành công.");
        } else {
            return ApiResponse.success("QUEUED", "Đã tiếp nhận yêu cầu gửi vé. Vui lòng kiểm tra hộp thư email.");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
        BookingResponse resp = this.bookingService.getBookingResponse(id);
        return ApiResponse.success(resp, "Lấy booking thành công");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        List<BookingResponse> bookings = this.bookingService.getAllBookings();
        return ApiResponse.success(bookings, "Lấy danh sách booking thành công");
    }

    @PutMapping("/{id}/expire")
    public ResponseEntity<ApiResponse<BookingResponse>> expireBooking(@PathVariable Long id) {
        BookingResponse booking = this.bookingService.expireBooking(id);
        return ApiResponse.success(booking, "Booking đã hết hạn");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id, Authentication authentication) {
        // Staff/Admin hủy hộ mọi đơn; khách hàng chỉ được hủy đơn của chính mình.
        boolean isStaffOrAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_STAFF"));
        String customerEmail = (!isStaffOrAdmin && authentication != null) ? authentication.getName() : null;
        BookingResponse booking = this.bookingService.cancelBooking(id, customerEmail);
        return ApiResponse.success(booking, "Hủy đơn đặt chỗ thành công");
    }
}
