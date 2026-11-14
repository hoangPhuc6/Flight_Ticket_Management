package com.flight.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.flight.backend.dto.ApiResponse;
import com.flight.backend.dto.booking.SelectSeatsRequest;
import com.flight.backend.dto.flight.SeatOptionResponse;
import com.flight.backend.service.SeatSelectionService;

@RestController
public class SeatSelectionController {

    private final SeatSelectionService seatSelectionService;

    public SeatSelectionController(SeatSelectionService seatSelectionService) {
        this.seatSelectionService = seatSelectionService;
    }

    // Sơ đồ ghế đầy đủ của chuyến bay (cho khách chọn chỗ)
    @GetMapping("/flights/{flightId}/available-seats")
    public ResponseEntity<ApiResponse<List<SeatOptionResponse>>> getAvailableSeats(
            @PathVariable Long flightId) {
        return ApiResponse.success(
                seatSelectionService.getAvailableSeats(flightId),
                "Lấy sơ đồ ghế thành công");
    }

    // Gán ghế cho các vé trong đơn
    @PostMapping("/bookings/{bookingId}/select-seats")
    public ResponseEntity<ApiResponse<String>> selectSeats(
            @PathVariable Long bookingId,
            @RequestBody SelectSeatsRequest request,
            Authentication authentication) {
        // Staff/Admin chọn ghế hộ mọi đơn; khách hàng chỉ được chọn ghế cho đơn của chính mình.
        boolean isStaffOrAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_STAFF"));
        String customerEmail = (!isStaffOrAdmin && authentication != null) ? authentication.getName() : null;
        seatSelectionService.selectSeats(bookingId, request, customerEmail);
        return ApiResponse.success("OK", "Đặt chỗ ngồi thành công");
    }
}
