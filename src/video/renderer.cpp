#include "renderer.hpp"
#include <iostream>
#include <cmath>

Renderer::Renderer()
    : m_width(800)
    , m_height(600)
    , m_sdlRenderer(nullptr)
    , m_frameTexture(nullptr)
    , m_animTime(0.0f)
{
}

Renderer::~Renderer() {
    shutdown();
}

bool Renderer::init(SDL_Window* window, int width, int height) {
    m_width = width;
    m_height = height;

    m_sdlRenderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
    if (!m_sdlRenderer) {
        std::cerr << "[Renderer] Falló renderer acelerado, intentando por software..." << std::endl;
        m_sdlRenderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    }

    if (!m_sdlRenderer) {
        std::cerr << "[Renderer] Error al crear SDL_Renderer: " << SDL_GetError() << std::endl;
        return false;
    }

    // Textura de streaming para software frame buffer (ARGB8888 o RGBA8888)
    m_frameTexture = SDL_CreateTexture(
        m_sdlRenderer,
        SDL_PIXELFORMAT_RGBA8888,
        SDL_TEXTUREACCESS_STREAMING,
        m_width,
        m_height
    );

    if (!m_frameTexture) {
        std::cerr << "[Renderer] Error al crear frame texture: " << SDL_GetError() << std::endl;
        return false;
    }

    // Inicializar buffer de píxeles
    m_frameBuffer.resize(m_width * m_height, 0xFF000000); // Negro opaco

    std::cout << "[Renderer] Renderizador inicializado a " << m_width << "x" << m_height << " (RGBA8888)." << std::endl;
    return true;
}

void Renderer::update(float deltaTime) {
    m_animTime += deltaTime;
}

void Renderer::drawFrame() {
    if (!m_sdlRenderer || !m_frameTexture) return;

    // Fondo oscuro estilo piedra Diablo
    clear(0x0A0A0DFF);

    // Efecto de resplandor de fuego en la parte inferior (estilo fogata de selección de héroe)
    int centerY = m_height - 90;
    int centerX = m_width / 2;
    int radius = 180 + static_cast<int>(std::sin(m_animTime * 5.0f) * 10.0f);

    for (int y = m_height - 240; y < m_height; ++y) {
        for (int x = centerX - radius; x <= centerX + radius; ++x) {
            if (x < 0 || x >= m_width || y < 0 || y >= m_height) continue;

            float dx = static_cast<float>(x - centerX);
            float dy = static_cast<float>(y - centerY);
            float dist = std::sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                float factor = 1.0f - (dist / radius);
                uint8_t r = static_cast<uint8_t>(std::min(255.0f, factor * 220.0f + 30.0f));
                uint8_t g = static_cast<uint8_t>(std::min(255.0f, factor * 70.0f));
                uint8_t b = 15;
                setPixel(x, y, (r << 24) | (g << 16) | (b << 8) | 0xFF);
            }
        }
    }

    // Actualizar textura de SDL con el frame buffer
    SDL_UpdateTexture(
        m_frameTexture,
        nullptr,
        m_frameBuffer.data(),
        m_width * sizeof(uint32_t)
    );

    // Presentar en pantalla
    SDL_RenderClear(m_sdlRenderer);
    SDL_RenderCopy(m_sdlRenderer, m_frameTexture, nullptr, nullptr);
    SDL_RenderPresent(m_sdlRenderer);
}

void Renderer::clear(uint32_t color) {
    std::fill(m_frameBuffer.begin(), m_frameBuffer.end(), color);
}

void Renderer::setPixel(int x, int y, uint32_t color) {
    if (x >= 0 && x < m_width && y >= 0 && y < m_height) {
        m_frameBuffer[y * m_width + x] = color;
    }
}

void Renderer::blitSurface(int destX, int destY, const uint32_t* srcPixels, int srcW, int srcH) {
    for (int y = 0; y < srcH; ++y) {
        int targetY = destY + y;
        if (targetY < 0 || targetY >= m_height) continue;

        for (int x = 0; x < srcW; ++x) {
            int targetX = destX + x;
            if (targetX < 0 || targetX >= m_width) continue;

            uint32_t color = srcPixels[y * srcW + x];
            // Alpha test simple (si no es transparente)
            if ((color & 0x000000FF) > 0) {
                m_frameBuffer[targetY * m_width + targetX] = color;
            }
        }
    }
}

void Renderer::shutdown() {
    if (m_frameTexture) {
        SDL_DestroyTexture(m_frameTexture);
        m_frameTexture = nullptr;
    }
    if (m_sdlRenderer) {
        SDL_DestroyRenderer(m_sdlRenderer);
        m_sdlRenderer = nullptr;
    }
}
