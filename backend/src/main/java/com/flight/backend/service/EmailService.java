package com.flight.backend.service;

import com.flight.backend.entity.Airport;
import com.flight.backend.entity.Booking;
import com.flight.backend.entity.Flight;
import com.flight.backend.entity.Passenger;
import com.flight.backend.entity.Route;
import com.flight.backend.entity.Ticket;
import com.flight.backend.entity.TicketClass;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
    private static final Locale LOCALE_VN = new Locale("vi", "VN");

    // Gửi email text thuần dùng chung (thông báo chuyến bay, ...)
    public void sendText(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        }
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    // Gửi OTP đặt lại mật khẩu
    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (fromAddress != null && !fromAddress.isBlank()) {
            message.setFrom(fromAddress);
        } else {
            message.setFrom("easyflight-support@gmail.com");
        }
        message.setTo(toEmail);
        message.setSubject("[EasyFlight] - Mã xác thực đặt lại mật khẩu");

        String content = "Chào bạn,\n\n"
                + "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản EasyFlight.\n"
                + "Mã OTP xác thực của bạn là: " + otpCode + "\n"
                + "Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ hỗ trợ EasyFlight.";

        message.setText(content);
        mailSender.send(message);
    }

    // Gửi email định dạng HTML
    public void sendHtml(String to, String subject, String htmlContent) throws Exception {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        String senderAddress = (fromAddress != null && !fromAddress.isBlank()) ? fromAddress : "easyflight.noreply@gmail.com";
        helper.setFrom(senderAddress, "EasyFlight Airlines");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(mimeMessage);
    }

    // Gửi Email Vé Điện Tử (E-Ticket) cho Booking
    public boolean sendETicketEmail(Booking booking) {
        if (booking == null) {
            return false;
        }

        Set<String> recipientEmails = new LinkedHashSet<>();
        if (booking.getCustomer() != null && booking.getCustomer().getEmail() != null && !booking.getCustomer().getEmail().isBlank()) {
            recipientEmails.add(booking.getCustomer().getEmail().trim());
        }

        if (booking.getTickets() != null) {
            for (Ticket ticket : booking.getTickets()) {
                Passenger p = ticket.getPassenger();
                if (p != null && p.getEmail() != null && !p.getEmail().isBlank()) {
                    recipientEmails.add(p.getEmail().trim());
                }
            }
        }

        if (recipientEmails.isEmpty()) {
            return false;
        }

        String pnr = booking.getPnrCode() != null ? booking.getPnrCode() : ("#" + booking.getId());
        String subject = "✈️ [EasyFlight] Vé máy bay điện tử & Xác nhận đặt chỗ - Mã PNR: " + pnr;
        String htmlContent = buildETicketHtml(booking);

        boolean anySuccess = false;
        for (String email : recipientEmails) {
            try {
                sendHtml(email, subject, htmlContent);
                anySuccess = true;
            } catch (Exception e) {
                System.err.println("Gửi email vé điện tử thất bại tới " + email + ": " + e.getMessage());
            }
        }

        return anySuccess;
    }

    private String buildETicketHtml(Booking booking) {
        String pnr = escapeHtml(booking.getPnrCode() != null ? booking.getPnrCode() : ("#" + booking.getId()));
        String customerName = escapeHtml(booking.getCustomer() != null && booking.getCustomer().getFullName() != null
                ? booking.getCustomer().getFullName() : "Quý khách");

        Flight flight = booking.getFlight();
        String flightCode = flight != null && flight.getFlightCode() != null ? escapeHtml(flight.getFlightCode()) : "N/A";
        String airlineName = "EasyFlight Airlines";
        if (flight != null && flight.getAirplane() != null && flight.getAirplane().getAirline() != null
                && flight.getAirplane().getAirline().getAirlineName() != null) {
            airlineName = escapeHtml(flight.getAirplane().getAirline().getAirlineName());
        }

        Route route = flight != null ? flight.getRoute() : null;
        Airport depAirport = route != null ? route.getDepartureAirport() : null;
        Airport arrAirport = route != null ? route.getArrivalAirport() : null;

        String depCode = depAirport != null ? escapeHtml(depAirport.getAirportCode()) : "SGN";
        String depCity = depAirport != null && depAirport.getCity() != null ? escapeHtml(depAirport.getCity()) : "Điểm đi";
        String depName = depAirport != null && depAirport.getName() != null ? escapeHtml(depAirport.getName()) : "";

        String arrCode = arrAirport != null ? escapeHtml(arrAirport.getAirportCode()) : "HAN";
        String arrCity = arrAirport != null && arrAirport.getCity() != null ? escapeHtml(arrAirport.getCity()) : "Điểm đến";
        String arrName = arrAirport != null && arrAirport.getName() != null ? escapeHtml(arrAirport.getName()) : "";

        String depTime = flight != null && flight.getDepartureTime() != null ? formatDateTime(flight.getDepartureTime()) : "Chưa xác định";
        String arrTime = flight != null && flight.getArrivalTime() != null ? formatDateTime(flight.getArrivalTime()) : "Chưa xác định";
        String duration = flight != null && flight.getEstimateDuration() > 0 ? (flight.getEstimateDuration() + " phút") : "Tiêu chuẩn";

        // Tiền
        BigDecimal total = booking.getTotalAmount() != null ? booking.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal discount = booking.getDiscountAmount() != null ? booking.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal finalAmount = booking.getFinalAmount() != null ? booking.getFinalAmount() : total.subtract(discount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        // Bảng hành khách & vé
        StringBuilder passengerRows = new StringBuilder();
        List<Ticket> tickets = booking.getTickets();
        if (tickets != null && !tickets.isEmpty()) {
            int idx = 1;
            for (Ticket t : tickets) {
                Passenger p = t.getPassenger();
                String pName = p != null && p.getFullName() != null ? escapeHtml(p.getFullName()) : "Hành khách";
                String docNum = p != null && p.getDocumentNumber() != null ? escapeHtml(p.getDocumentNumber()) : "—";
                String tNum = t.getTicketNumber() != null ? escapeHtml(t.getTicketNumber()) : ("TK-" + t.getId());
                TicketClass tc = t.getTicketClass();
                String className = tc != null && tc.getClassName() != null ? escapeHtml(tc.getClassName()) : "Phổ thông";

                String seatNumber = "Chưa chọn";
                if (t.getFlightSeat() != null && t.getFlightSeat().getSeat() != null
                        && t.getFlightSeat().getSeat().getSeatNumber() != null) {
                    seatNumber = escapeHtml(t.getFlightSeat().getSeat().getSeatNumber());
                }

                passengerRows.append("<tr style=\"border-bottom: 1px solid #e2e8f0; font-size: 13px;\">")
                        .append("<td style=\"padding: 10px 12px; color: #1e293b; font-weight: 600;\">").append(idx++).append(". ").append(pName).append("</td>")
                        .append("<td style=\"padding: 10px 12px; color: #475569;\">").append(docNum).append("</td>")
                        .append("<td style=\"padding: 10px 12px; color: #475569; font-family: monospace;\">").append(tNum).append("</td>")
                        .append("<td style=\"padding: 10px 12px; color: #475569;\">").append(className).append("</td>")
                        .append("<td style=\"padding: 10px 12px; font-weight: bold; color: #4f46e5;\">").append(seatNumber).append("</td>")
                        .append("</tr>");
            }
        } else {
            passengerRows.append("<tr><td colspan=\"5\" style=\"padding: 12px; text-align: center; color: #94a3b8;\">Chưa có thông tin chi tiết vé.</td></tr>");
        }

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
                .append("<html lang=\"vi\">")
                .append("<head><meta charset=\"UTF-8\"><title>Vé máy bay điện tử EasyFlight</title></head>")
                .append("<body style=\"margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;\">")
                .append("<div style=\"max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;\">")

                // Header
                .append("<div style=\"background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 25px; text-align: center; color: #ffffff;\">")
                .append("<div style=\"font-size: 24px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px;\">✈️ EASYFLIGHT AIRLINES</div>")
                .append("<div style=\"font-size: 13px; opacity: 0.95; text-transform: uppercase; letter-spacing: 1.5px;\">VÉ MÁY BAY ĐIỆN TỬ & XÁC NHẬN ĐẶT CHỖ</div>")
                .append("</div>")

                // Nội dung chính
                .append("<div style=\"padding: 25px;\">")

                // Lời chào & PNR Box
                .append("<p style=\"font-size: 15px; margin-top: 0; line-height: 1.5;\">Kính gửi <strong>").append(customerName).append("</strong>,</p>")
                .append("<p style=\"font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.5;\">Đơn đặt vé của quý khách đã được xác nhận và thanh toán thành công. Dưới đây là thông tin hành trình chi tiết của quý khách:</p>")

                .append("<div style=\"background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; text-align: center;\">")
                .append("<div style=\"font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;\">MÃ ĐẶT CHỖ (PNR)</div>")
                .append("<div style=\"font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: 4px; margin: 4px 0;\">").append(pnr).append("</div>")
                .append("<div style=\"display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px;\">✓ ĐÃ THANH TOÁN THÀNH CÔNG</div>")
                .append("</div>")

                // Thẻ thông tin chuyến bay
                .append("<div style=\"border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;\">")
                .append("<div style=\"background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;\">")
                .append("<span style=\"font-weight: 700; color: #1e293b; font-size: 14px;\">Chuyến bay: <span style=\"color: #4f46e5;\">").append(flightCode).append("</span></span>")
                .append("<span style=\"font-size: 13px; color: #64748b; float: right;\">").append(airlineName).append("</span>")
                .append("<div style=\"clear: both;\"></div>")
                .append("</div>")

                // Lộ trình
                .append("<div style=\"padding: 16px;\">")
                .append("<table style=\"width: 100%; text-align: center; border-collapse: collapse;\">")
                .append("<tr>")
                .append("<td style=\"width: 40%; text-align: left;\">")
                .append("<div style=\"font-size: 26px; font-weight: 800; color: #1e293b;\">").append(depCode).append("</div>")
                .append("<div style=\"font-size: 13px; font-weight: 600; color: #334155;\">").append(depCity).append("</div>")
                .append("<div style=\"font-size: 11px; color: #64748b;\">").append(depName).append("</div>")
                .append("<div style=\"font-size: 13px; font-weight: 700; color: #4f46e5; margin-top: 6px;\">🛫 ").append(depTime).append("</div>")
                .append("</td>")

                .append("<td style=\"width: 20%; text-align: center;\">")
                .append("<div style=\"font-size: 20px;\">✈️</div>")
                .append("<div style=\"font-size: 11px; color: #94a3b8; margin-top: 4px;\">").append(duration).append("</div>")
                .append("</td>")

                .append("<td style=\"width: 40%; text-align: right;\">")
                .append("<div style=\"font-size: 26px; font-weight: 800; color: #1e293b;\">").append(arrCode).append("</div>")
                .append("<div style=\"font-size: 13px; font-weight: 600; color: #334155;\">").append(arrCity).append("</div>")
                .append("<div style=\"font-size: 11px; color: #64748b;\">").append(arrName).append("</div>")
                .append("<div style=\"font-size: 13px; font-weight: 700; color: #4f46e5; margin-top: 6px;\">🛬 ").append(arrTime).append("</div>")
                .append("</td>")
                .append("</tr>")
                .append("</table>")
                .append("</div>")
                .append("</div>")

                // Bảng danh sách hành khách
                .append("<div style=\"margin-bottom: 24px;\">")
                .append("<div style=\"font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 8px;\">DANH SÁCH HÀNH KHÁCH & VÉ</div>")
                .append("<table style=\"width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;\">")
                .append("<thead>")
                .append("<tr style=\"background: #f8fafc; color: #475569; font-size: 12px; text-transform: uppercase; text-align: left;\">")
                .append("<th style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0;\">Họ tên</th>")
                .append("<th style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0;\">Số giấy tờ</th>")
                .append("<th style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0;\">Mã vé</th>")
                .append("<th style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0;\">Hạng vé</th>")
                .append("<th style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0;\">Ghế</th>")
                .append("</tr>")
                .append("</thead>")
                .append("<tbody>")
                .append(passengerRows)
                .append("</tbody>")
                .append("</table>")
                .append("</div>")

                // Chi tiết thanh toán
                .append("<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;\">")
                .append("<div style=\"font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 8px;\">CHI TIẾT THANH TOÁN</div>")
                .append("<table style=\"width: 100%; font-size: 13px; color: #475569;\">")
                .append("<tr><td>Tạm tính:</td><td style=\"text-align: right; font-weight: 600;\">").append(formatMoney(total)).append("</td></tr>");

        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            html.append("<tr><td style=\"color: #16a34a;\">Giảm giá (Voucher):</td><td style=\"text-align: right; color: #16a34a; font-weight: 600;\">-").append(formatMoney(discount)).append("</td></tr>");
        }

        html.append("<tr style=\"border-top: 1px dashed #cbd5e1; font-size: 15px;\">")
                .append("<td style=\"padding-top: 8px; font-weight: 700; color: #1e293b;\">Tổng số tiền thanh toán:</td>")
                .append("<td style=\"padding-top: 8px; text-align: right; font-weight: 800; color: #4f46e5;\">").append(formatMoney(finalAmount)).append("</td>")
                .append("</tr>")
                .append("</table>")
                .append("</div>")

                // Hướng dẫn & Lưu ý quan trọng
                .append("<div style=\"background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e; line-height: 1.6;\">")
                .append("<strong style=\"display: block; margin-bottom: 4px;\">📌 Lưu ý quan trọng cho hành khách:</strong>")
                .append("• Quý khách vui lòng có mặt tại sân bay ít nhất <strong>90 - 120 phút</strong> trước giờ khởi hành.<br/>")
                .append("• Vui lòng xuất trình <strong>Mã đặt chỗ (PNR)</strong> cùng CMND/CCCD/Hộ chiếu bản gốc còn hiệu lực tại quầy làm thủ tục.<br/>")
                .append("• Quý khách có thể truy cập website mục <strong>\"Chuyến bay của tôi\"</strong> để chọn ghế ngồi hoặc theo dõi lịch bay.")
                .append("</div>")

                // Footer
                .append("<div style=\"text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; line-height: 1.5;\">")
                .append("Hệ thống bán vé máy bay trực tuyến <strong>EasyFlight</strong><br/>")
                .append("Hotline hỗ trợ: <strong>1900 6868</strong> • Email: support@easyflight.vn<br/>")
                .append("Chúc quý khách có một chuyến bay an toàn và thoải mái!")
                .append("</div>")

                .append("</div>")
                .append("</div>")
                .append("</body>")
                .append("</html>");

        return html.toString();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0 đ";
        return NumberFormat.getInstance(LOCALE_VN).format(amount) + " đ";
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "N/A";
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
