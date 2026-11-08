package com.flight.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import jakarta.persistence.Table;
import com.flight.backend.entity.enums.PassengerGender;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @Column(name = "customer_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "customer_id", referencedColumnName = "user_id")
    private User user;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "address", length = 255)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 10)
    private PassengerGender gender;

    @Column(name = "document_number", length = 30)
    private String documentNumber;

    @Column(name = "nationality", length = 100)
    private String nationality;

    // ===== Tùy chọn nhận thông báo (null = mặc định bật) =====
    @Column(name = "email_notifications")
    private Boolean emailNotifications;

    @Column(name = "sms_alerts")
    private Boolean smsAlerts;

    @Column(name = "promo_emails")
    private Boolean promoEmails;
}
