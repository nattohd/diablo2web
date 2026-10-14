#include "engine.hpp"
#include "renderer.hpp"
#include "vfs.hpp"
#include <iostream>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

Engine::Engine()
    : m_running(false)
    , m_state(GameState::Boot)
    , m_window(nullptr)
    , m_renderer(nullptr)
    , m_vfs(nullptr)
{
}

Engine::~Engine() {
    shutdown();
}

bool Engine::init(int width, int height) {
    std::cout << "[Engine] Inicializando Diablo II Web Engine..." << std::endl;

    if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_EVENTS) < 0) {
        std::cerr << "[Engine] Error al inicializar SDL2: " << SDL_GetError() << std::endl;
        return false;
    }

    m_window = SDL_CreateWindow(
        "Diablo II WebAssembly",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        width,
        height,
        SDL_WINDOW_SHOWN
    );

    if (!m_window) {
        std::cerr << "[Engine] Error al crear la ventana: " << SDL_GetError() << std::endl;
        return false;
    }

    // Inicializar Renderer
    m_renderer = std::make_unique<Renderer>();
    if (!m_renderer->init(m_window, width, height)) {
        std::cerr << "[Engine] Error al inicializar el renderer." << std::endl;
        return false;
    }

    // Inicializar Virtual File System
    m_vfs = std::make_unique<VirtualFileSystem>();
    if (!m_vfs->init()) {
        std::cerr << "[Engine] Advertencia: Error parcial en el VFS." << std::endl;
    }

    m_state = GameState::MainMenu;
    m_running = true;

    std::cout << "[Engine] Motor inicializado a 800x600 con soporte de audio y VFS." << std::endl;
    return true;
}

void Engine::update(float deltaTime) {
    if (!m_running) return;

    // Lógica de juego, temporizadores y actualización de entidades
    if (m_renderer) {
        m_renderer->update(deltaTime);
    }
}

void Engine::render() {
    if (!m_running || !m_renderer) return;
    m_renderer->drawFrame();
}

void Engine::handleEvent(const SDL_Event& event) {
    if (event.type == SDL_QUIT) {
        m_running = false;
    } else if (event.type == SDL_KEYDOWN) {
        if (event.key.keysym.sym == SDLK_ESCAPE) {
            std::cout << "[Engine] Tecla ESC presionada." << std::endl;
        }
    } else if (event.type == SDL_MOUSEBUTTONDOWN) {
        std::cout << "[Engine] Clic en (" << event.button.x << ", " << event.button.y << ")" << std::endl;
    }
}

void Engine::shutdown() {
    if (m_renderer) {
        m_renderer->shutdown();
        m_renderer.reset();
    }

    if (m_window) {
        SDL_DestroyWindow(m_window);
        m_window = nullptr;
    }

    SDL_Quit();
    m_running = false;
    std::cout << "[Engine] Motor finalizado correctamente." << std::endl;
}
