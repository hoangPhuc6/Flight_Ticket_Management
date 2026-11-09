package com.flight.backend.dto.airport;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAirportRequest {

    @NotBlank(message = "Vui lòng nhập mã sân bay")
    @Pattern(regexp = "^[A-Za-z]{3}$", message = "Mã sân bay phải gồm đúng 3 chữ cái (VD: SGN)")
    private String airportCode;

    @NotBlank(message = "Vui lòng nhập tên sân bay")
    private String name;

    @NotBlank(message = "Vui lòng nhập thành phố")
    private String city;

    @NotBlank(message = "Vui lòng nhập quốc gia")
    private String country;
}
