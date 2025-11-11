package group.haite.report.doccomparatorweb.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    @GetMapping("/{path:^(?!api).*$}")
    public String forward() {
        return "forward:/index.html";
    }
}