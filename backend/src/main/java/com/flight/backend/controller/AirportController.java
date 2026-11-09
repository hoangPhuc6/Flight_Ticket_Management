package com.flight.backend.controller;

import com.flight.backend.dto.airport.CreateAirportRequest;
import com.flight.backend.dto.airport.UpdateAirportRequest;
import com.flight.backend.dto.ApiResponse;
import com.flight.backend.dto.airport.AirportResponse;
import com.flight.backend.service.AirportService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/airports")
public class AirportController {

    private final AirportService airportService;

    public AirportController(AirportService airportService) {
        this.airportService = airportService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AirportResponse>> create(@Valid @RequestBody CreateAirportRequest req) {
        AirportResponse resp = this.airportService.create(req);
        return ApiResponse.success(resp, "Tạo mới sân bay thành công");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AirportResponse>>> getAll() {
        List<AirportResponse> airportList = this.airportService.getAll();
        return ApiResponse.success(airportList, "Lấy danh sách các sân bay thành công");
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AirportResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAirportRequest req) {
        AirportResponse resp = this.airportService.update(id, req);
        return ApiResponse.success(resp, "Cập nhật sân bay thành công");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        this.airportService.delete(id);
        return ApiResponse.success("OK", "Xóa sân bay thành công");
    }
}