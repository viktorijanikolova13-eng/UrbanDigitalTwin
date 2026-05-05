package com.example.smartcity.repository;

import com.example.smartcity.model.domain.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}