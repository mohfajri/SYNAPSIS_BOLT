package com.taskhub.enterprise.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    // Representation of our PostgreSQL Project Entity
    public static class ProjectEntity {
        public String id;
        public String kode;
        public String nama;
        public String modul;
        public String pic;
        public String client;
        public String asal;
        public String status;
        public LocalDate startDate;
        public LocalDate endDate;
        public LocalDate completionDate;
        public String prasyarat;
        public String notes;
        public String url;
        public LocalDateTime createdAt;
    }

    private List<ProjectEntity> mockProjects = new ArrayList<>();

    @GetMapping
    public ResponseEntity<List<ProjectEntity>> getAllProjects() {
        return ResponseEntity.ok(mockProjects);
    }

    @PostMapping
    public ResponseEntity<ProjectEntity> createProject(@RequestBody ProjectEntity project) {
        project.id = "p-" + UUID.randomUUID().toString().substring(0, 7);
        project.createdAt = LocalDateTime.now();
        if (project.status == null) {
            project.status = "On Track";
        }
        mockProjects.add(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody ProjectEntity update) {
        Optional<ProjectEntity> found = mockProjects.stream().filter(p -> p.id.equals(id)).findFirst();
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project tidak ditemukan"));
        }

        ProjectEntity p = found.get();
        p.nama = update.nama != null ? update.nama : p.nama;
        p.modul = update.modul != null ? update.modul : p.modul;
        p.pic = update.pic != null ? update.pic : p.pic;
        p.client = update.client != null ? update.client : p.client;
        p.asal = update.asal != null ? update.asal : p.asal;
        p.status = update.status != null ? update.status : p.status;
        p.startDate = update.startDate != null ? update.startDate : p.startDate;
        p.endDate = update.endDate != null ? update.endDate : p.endDate;
        p.completionDate = update.completionDate != null ? update.completionDate : p.completionDate;
        p.prasyarat = update.prasyarat != null ? update.prasyarat : p.prasyarat;
        p.notes = update.notes != null ? update.notes : p.notes;
        p.url = update.url != null ? update.url : p.url;

        return ResponseEntity.ok(p);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable String id) {
        boolean removed = mockProjects.removeIf(p -> p.id.equals(id));
        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Project tidak ditemukan"));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }
}
