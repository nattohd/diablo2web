#include "engine.hpp"
#include <iostream>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

// Puntero global al motor para el bucle principal de Emscripten
static Engine* g_engine = nullptr;
static uint32_t g_lastTicks = 0;

void mainLoopStep(void* arg) {
    Engine* engine = static_cast<Engine*>(arg);
    if (!engine || !engine->isRunning()) {
#ifdef __EMSCRIPTEN__
        emscripten_cancel_main_loop();
#endif
        return;
    }

    uint32_t currentTicks = SDL_GetTicks();
    float deltaTime = (currentTicks - g_lastTicks) / 1000.0f;
    g_lastTicks = currentTicks;

    // Procesar eventos de SDL2 (teclado, ratón, ventana)
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
        engine->handleEvent(event);
    }

    // Actualizar y renderizar fotograma
    engine->update(deltaTime);
    engine->render();
}

extern "C" {
    // Funciones exportadas a JavaScript (invocables mediante Module.ccall / cwrap)
    EMSCRIPTEN_KEEPALIVE
    int d2_init_engine(int width, int height) {
        if (!g_engine) {
            g_engine = new Engine();
            if (!g_engine->init(width, height)) {
                return 0;
            }
        }
        return 1;
    }

    EMSCRIPTEN_KEEPALIVE
    int d2_is_running() {
        return (g_engine && g_engine->isRunning()) ? 1 : 0;
    }
}

int main(int argc, char* argv[]) {
    std::cout << "=================================================" << std::endl;
    std::cout << "   DIABLO II: LORD OF DESTRUCTION - WASM ENGINE  " << std::endl;
    std::cout << "=================================================" << std::endl;

    Engine engine;
    if (!engine.init(800, 600)) {
        std::cerr << "[Main] Error al inicializar el motor." << std::endl;
        return 1;
    }

    g_engine = &engine;
    g_lastTicks = SDL_GetTicks();

#ifdef __EMSCRIPTEN__
    // En el navegador, emscripten_set_main_loop delega el bucle a requestAnimationFrame
    // fps = 0 o 60, simulate_infinite_loop = 1
    std::cout << "[Main] Iniciando bucle Emscripten a 60 FPS..." << std::endl;
    emscripten_set_main_loop_arg(mainLoopStep, &engine, 0, 1);
#else
    // En PC nativo, bucle clásico con control de framerate
    std::cout << "[Main] Ejecutando bucle de juego nativo..." << std::endl;
    while (engine.isRunning()) {
        mainLoopStep(&engine);
        SDL_Delay(16); // ~60 FPS
    }
#endif

    engine.shutdown();
    g_engine = nullptr;
    return 0;
}
