package com.flight.backend.repository;

import com.flight.backend.entity.Airport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AirportRepository extends JpaRepository<Airport, Long> {

    boolean existsByAirportCode(String airportCode);

    boolean existsByAirportCodeAndIdNot(String airportCode, Long id);
}