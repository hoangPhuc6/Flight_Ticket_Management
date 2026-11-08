package com.flight.backend.dto.profile;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PreferencesDto {

    @NotNull(message = "Thiếu tùy chọn nhận email")
    private Boolean emailNotifications;

    @NotNull(message = "Thiếu tùy chọn nhận SMS")
    private Boolean smsAlerts;

    @NotNull(message = "Thiếu tùy chọn nhận email khuyến mãi")
    private Boolean promoEmails;
}
