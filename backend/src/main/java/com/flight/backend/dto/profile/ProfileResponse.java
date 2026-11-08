package com.flight.backend.dto.profile;

import com.flight.backend.entity.enums.PassengerGender;
import com.flight.backend.entity.enums.UserRole;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private UserRole role;
    private LocalDateTime createdAt;

    private LocalDate dateOfBirth;
    private PassengerGender gender;
    private String documentNumber;
    private String nationality;
    private String address;
    private String avatarUrl;

    private PreferencesDto preferences;
}
