#pragma once

#include <cstdint>
#include <vector>
#include <SDL2/SDL.h>

class Renderer {
public:
    Renderer();
    ~Renderer();

    bool init(SDL_Window* window, int width = 800, int height = 600);
    void update(float deltaTime);
    void drawFrame();
    void shutdown();

    void clear(uint32_t color);
    void setPixel(int x, int y, uint32_t color);
    void blitSurface(int destX, int destY, const uint32_t* srcPixels, int srcW, int srcH);

    int getWidth() const { return m_width; }
    int getHeight() const { return m_height; }

private:
    int m_width;
    int m_height;
    SDL_Renderer* m_sdlRenderer;
    SDL_Texture* m_frameTexture;
    std::vector<uint32_t> m_frameBuffer;
    float m_animTime;
};
