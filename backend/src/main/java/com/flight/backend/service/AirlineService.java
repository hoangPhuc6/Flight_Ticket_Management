package com.flight.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.flight.backend.dto.airline.AirlineResponse;
import com.flight.backend.dto.airline.CreateAirlineRequest;
import com.flight.backend.dto.airline.UpdateAirlineRequest;
import com.flight.backend.entity.Airline;
import com.flight.backend.repository.AirlineRepository;

@Service
public class AirlineService {

    private final AirlineRepository airlineRepository;

    public AirlineService(AirlineRepository airlineRepository) {
        this.airlineRepository = airlineRepository;
    }

    // CREATE
    public AirlineResponse createAirline(CreateAirlineRequest req) {

        if (airlineRepository.existsByAirlineCode(req.getAirlineCode())) {
            throw new RuntimeException(
                    "Airline code '" + req.getAirlineCode()
                            + "' already exists");
        }

        if (airlineRepository.existsByAirlineName(req.getAirlineName())) {
            throw new RuntimeException(
                    "Airline name '" + req.getAirlineName()
                            + "' already exists");
        }

        Airline airline = new Airline();

        airline.setAirlineCode(
                req.getAirlineCode().trim().toUpperCase());

        airline.setAirlineName(
                req.getAirlineName().trim());

        airline.setDescription(req.getDescription());
        airline.setLogo(req.getLogo());

        Airline saved = airlineRepository.save(airline);

        return mapToResponse(saved);
    }

    // GET ALL
    public List<AirlineResponse> getAllAirlines() {

        return airlineRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // UPDATE
    public AirlineResponse updateAirline(
            Long id,
            UpdateAirlineRequest request) {

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Airline not found"));

        if (airlineRepository.existsByAirlineCodeAndIdNot(
                request.getAirlineCode(),
                id)) {

            throw new RuntimeException(
                    "Airline code '" + request.getAirlineCode()
                            + "' already exists");
        }

        if (airlineRepository.existsByAirlineNameAndIdNot(
                request.getAirlineName(),
                id)) {

            throw new RuntimeException(
                    "Airline name '" + request.getAirlineName()
                            + "' already exists");
        }
        

        airline.setAirlineCode(
                request.getAirlineCode().trim().toUpperCase());

        airline.setAirlineName(
                request.getAirlineName().trim());

        airline.setDescription(request.getDescription());
        airline.setLogo(request.getLogo());

        Airline saved = airlineRepository.save(airline);

        return mapToResponse(saved);
    }

    // DELETE
    public void deleteAirline(Long id) {

        Airline airline = airlineRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Airline not found"));

        if (!airline.getAirplanes().isEmpty()) {
            throw new RuntimeException(
                    "Cannot delete airline because it is being used by airplanes");
        }

        airlineRepository.delete(airline);
    }

    private AirlineResponse mapToResponse(Airline airline) {

        AirlineResponse response = new AirlineResponse();

        response.setId(airline.getId());
        response.setAirlineCode(airline.getAirlineCode());
        response.setAirlineName(airline.getAirlineName());
        response.setDescription(airline.getDescription());
        response.setLogo(airline.getLogo());

        return response;
    }
}