package com.flight.backend.controller;

import com.flight.backend.dto.ApiResponse;
import com.flight.backend.dto.profile.PreferencesDto;
import com.flight.backend.dto.profile.ProfileResponse;
import com.flight.backend.dto.profile.UpdateProfileRequest;
import com.flight.backend.security.CustomUserDetails;
import com.flight.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.success(profileService.getMyProfile(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateProfileRequest req) {
        ProfileResponse resp = profileService.updateMyProfile(principal.getId(), req);
        return ApiResponse.success(resp, "Cập nhật hồ sơ cá nhân thành công");
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<PreferencesDto>> updateMyPreferences(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody PreferencesDto req) {
        PreferencesDto resp = profileService.updateMyPreferences(principal.getId(), req);
        return ApiResponse.success(resp, "Đã lưu tùy chọn thông báo");
    }
}
