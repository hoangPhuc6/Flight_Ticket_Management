package com.flight.backend.service;

import com.flight.backend.dto.profile.PreferencesDto;
import com.flight.backend.dto.profile.ProfileResponse;
import com.flight.backend.dto.profile.UpdateProfileRequest;
import com.flight.backend.entity.Customer;
import com.flight.backend.entity.User;
import com.flight.backend.repository.CustomerRepository;
import com.flight.backend.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public ProfileService(UserRepository userRepository, CustomerRepository customerRepository) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getMyProfile(Long userId) {
        User user = findUser(userId);
        Customer customer = customerRepository.findById(userId).orElse(null);
        return toResponse(user, customer);
    }

    @Transactional
    public ProfileResponse updateMyProfile(Long userId, UpdateProfileRequest req) {
        User user = findUser(userId);

        String phone = blankToNull(req.getPhoneNumber());
        if (phone != null && userRepository.existsByPhoneNumberAndIdNot(phone, userId)) {
            throw new RuntimeException("Số điện thoại đã được sử dụng bởi tài khoản khác");
        }

        user.setFullName(req.getFullName().trim());
        user.setPhoneNumber(phone);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        Customer customer = getOrCreateCustomer(user);
        customer.setBirthday(req.getDateOfBirth());
        customer.setGender(req.getGender());
        customer.setDocumentNumber(blankToNull(req.getDocumentNumber()));
        customer.setNationality(blankToNull(req.getNationality()));
        customer.setAddress(blankToNull(req.getAddress()));
        customerRepository.save(customer);

        return toResponse(user, customer);
    }

    @Transactional
    public PreferencesDto updateMyPreferences(Long userId, PreferencesDto req) {
        User user = findUser(userId);
        Customer customer = getOrCreateCustomer(user);
        customer.setEmailNotifications(req.getEmailNotifications());
        customer.setSmsAlerts(req.getSmsAlerts());
        customer.setPromoEmails(req.getPromoEmails());
        customerRepository.save(customer);
        return toPreferences(customer);
    }

    // ================= HELPERS =================

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng"));
    }

    // Tài khoản đăng ký qua /auth/register chưa có bản ghi customers -> tạo khi cần
    private Customer getOrCreateCustomer(User user) {
        return customerRepository.findById(user.getId()).orElseGet(() -> {
            // Không set id thủ công: để id = null thì Spring Data gọi persist(),
            // @MapsId sẽ tự lấy id từ user. Nếu set id, save() sẽ gọi merge()
            // và Hibernate 6 báo "null identifier" với entity dùng @MapsId.
            Customer c = new Customer();
            c.setUser(user);
            return c;
        });
    }

    private ProfileResponse toResponse(User user, Customer customer) {
        ProfileResponse.ProfileResponseBuilder b = ProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .preferences(toPreferences(customer));

        if (customer != null) {
            b.dateOfBirth(customer.getBirthday())
                    .gender(customer.getGender())
                    .documentNumber(customer.getDocumentNumber())
                    .nationality(customer.getNationality())
                    .address(customer.getAddress())
                    .avatarUrl(customer.getAvatarUrl());
        }
        return b.build();
    }

    private PreferencesDto toPreferences(Customer customer) {
        if (customer == null) {
            return new PreferencesDto(true, true, true);
        }
        return new PreferencesDto(
                orTrue(customer.getEmailNotifications()),
                orTrue(customer.getSmsAlerts()),
                orTrue(customer.getPromoEmails()));
    }

    private static Boolean orTrue(Boolean v) {
        return v == null ? Boolean.TRUE : v;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
