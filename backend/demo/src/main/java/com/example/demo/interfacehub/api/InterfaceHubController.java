package com.example.demo.interfacehub.api;

import com.example.demo.interfacehub.model.ManagedInterface;
import com.example.demo.interfacehub.service.InterfaceHubService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "https://*.vercel.app"}, allowCredentials = "false")
public class InterfaceHubController {

    private final InterfaceHubService interfaceHubService;

    public InterfaceHubController(InterfaceHubService interfaceHubService) {
        this.interfaceHubService = interfaceHubService;
    }

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {
        return interfaceHubService.getDashboard();
    }

    @GetMapping("/interfaces")
    public List<ManagedInterface> getInterfaces() {
        return interfaceHubService.getInterfaces();
    }

    @PostMapping("/interfaces")
    public ManagedInterface createInterface(@RequestBody InterfaceUpsertRequest request) {
        return interfaceHubService.createInterface(request);
    }

    @PutMapping("/interfaces/{id}")
    public ManagedInterface updateInterface(@PathVariable String id, @RequestBody InterfaceUpsertRequest request) {
        return interfaceHubService.updateConfig(id, request);
    }

    @DeleteMapping("/interfaces/{id}")
    public void deleteInterface(@PathVariable String id) {
        interfaceHubService.deleteInterface(id);
    }

    @PostMapping("/interfaces/{id}/retry")
    public ManagedInterface retry(@PathVariable String id) {
        return interfaceHubService.retry(id);
    }
}
