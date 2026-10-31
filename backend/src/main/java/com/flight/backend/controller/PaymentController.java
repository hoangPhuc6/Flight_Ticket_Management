package com.flight.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flight.backend.dto.ApiResponse;
import com.flight.backend.dto.payment.PaymentResponse;
import com.flight.backend.service.PaymentService;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(final PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable Long id) {
        PaymentResponse res = this.paymentService.getPaymentById(id);
        return ApiResponse.success(res, "Lấy payment thành công");
    }

    @PostMapping("/{paymentId}/success")
    public ResponseEntity<ApiResponse<PaymentResponse>> paymentSuccess(
            @PathVariable Long paymentId) {

        PaymentResponse response = paymentService.paymentSuccess(paymentId);

        return ApiResponse.success(response, "Thanh toán thành công");
    }
}
