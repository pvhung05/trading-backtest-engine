package com.trading.community;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.trading.community.controller.HealthController;
import com.trading.community.controller.IdeaController;
import com.trading.community.controller.PostController;

@SpringBootTest
class CommunityApplicationTests {

    @Autowired
    private HealthController healthController;

    @Autowired
    private IdeaController ideaController;

    @Autowired
    private PostController postController;

    @Test
    void contextLoads() {
        assertNotNull(healthController);
        assertNotNull(ideaController);
        assertNotNull(postController);
    }
}
