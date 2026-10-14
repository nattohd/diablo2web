#pragma once

#include <string>
#include <memory>
#include <SDL2/SDL.h>

class Renderer;
class VirtualFileSystem;

enum class GameState {
    Boot,
    MountingVFS,
    MainMenu,
    InGame,
    Paused
};

class Engine {
public:
    Engine();
    ~Engine();

    bool init(int width = 800, int height = 600);
    void update(float deltaTime);
    void render();
    void handleEvent(const SDL_Event& event);
    void shutdown();

    bool isRunning() const { return m_running; }
    GameState getState() const { return m_state; }

private:
    bool m_running;
    GameState m_state;
    SDL_Window* m_window;
    std::unique_ptr<Renderer> m_renderer;
    std::unique_ptr<VirtualFileSystem> m_vfs;
};
