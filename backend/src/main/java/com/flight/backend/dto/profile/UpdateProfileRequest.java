package com.flight.backend.dto.profile;

import com.flight.backend.entity.enums.PassengerGender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
    private String fullName;

    // Cho phép để trống; nếu nhập thì phải là SĐT 9-15 chữ số (có thể có dấu +)
    @Pattern(regexp = "^$|^\\+?[0-9]{9,15}$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Past(message = "Ngày sinh phải là ngày trong quá khứ")
    private LocalDate dateOfBirth;

    private PassengerGender gender;

    @Size(max = 30, message = "Số CCCD/Hộ chiếu tối đa 30 ký tự")
    private String documentNumber;

    @Size(max = 100, message = "Quốc tịch tối đa 100 ký tự")
    private String nationality;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    private String address;
}
