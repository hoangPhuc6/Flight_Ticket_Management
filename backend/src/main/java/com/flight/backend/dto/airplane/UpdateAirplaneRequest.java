package com.flight.backend.dto.airplane;

import com.flight.backend.entity.enums.AirplaneStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAirplaneRequest {

    @NotBlank(message = "Vui lòng nhập mã máy bay")
    @Size(min = 2, max = 10, message = "Mã máy bay phải từ 2 đến 10 ký tự")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Mã máy bay chỉ gồm chữ in hoa, số và dấu gạch ngang")
    private String airplaneCode;

    @NotNull(message = "Vui lòng chọn model")
    private Long modelId;

    @NotNull(message = "Vui lòng chọn hãng bay")
    private Long airlineId;

    @NotNull(message = "Vui lòng chọn trạng thái")
    private AirplaneStatus status;
}
