#include "vfs.hpp"
#include <iostream>
#include <fstream>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

VirtualFileSystem::VirtualFileSystem()
    : m_savePath("/saves")
{
}

VirtualFileSystem::~VirtualFileSystem() {
}

bool VirtualFileSystem::init() {
    std::cout << "[VFS] Inicializando Virtual File System..." << std::endl;

#ifdef __EMSCRIPTEN__
    // En Emscripten el montaje de IDBFS se invoca desde el Module preRun de JavaScript
    std::cout << "[VFS] Entorno WebAssembly detectado. Preparando punto de montaje " << m_savePath << std::endl;
    EM_ASM(
        if (typeof FS !== 'undefined') {
            try {
                FS.mkdir('/saves');
            } catch(e) {}
        }
    );
#else
    m_savePath = "./saves";
    std::cout << "[VFS] Entorno Nativo detectado. Directorio de guardado: " << m_savePath << std::endl;
#endif

    return true;
}

bool VirtualFileSystem::mountMpq(const std::string& path) {
    std::cout << "[VFS] Montando archivo MPQ: " << path << std::endl;
    m_mountedArchives.push_back(path);
    return true;
}

bool VirtualFileSystem::fileExists(const std::string& path) {
    std::ifstream f(path.c_str());
    return f.good();
}

std::vector<uint8_t> VirtualFileSystem::readFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        std::cerr << "[VFS] No se pudo abrir: " << path << std::endl;
        return {};
    }

    std::streamsize size = file.tellg();
    file.seekg(0, std::ios::beg);

    std::vector<uint8_t> buffer(size);
    if (file.read(reinterpret_cast<char*>(buffer.data()), size)) {
        return buffer;
    }

    return {};
}

bool VirtualFileSystem::saveCharacterFile(const std::string& heroName, const std::vector<uint8_t>& data) {
    std::string fullPath = m_savePath + "/" + heroName + ".d2s";
    std::ofstream out(fullPath, std::ios::binary);
    if (!out.is_open()) {
        std::cerr << "[VFS] Error al guardar partida en: " << fullPath << std::endl;
        return false;
    }

    out.write(reinterpret_cast<const char*>(data.data()), data.size());
    out.close();

    syncSaveDirectory();
    std::cout << "[VFS] Personaje guardado: " << fullPath << " (" << data.size() << " bytes)" << std::endl;
    return true;
}

std::vector<uint8_t> VirtualFileSystem::loadCharacterFile(const std::string& heroName) {
    std::string fullPath = m_savePath + "/" + heroName + ".d2s";
    return readFile(fullPath);
}

void VirtualFileSystem::syncSaveDirectory() {
#ifdef __EMSCRIPTEN__
    // Sincronizar cambios en memoria virtual hacia IndexedDB persistente
    EM_ASM(
        if (typeof FS !== 'undefined') {
            FS.syncfs(false, function (err) {
                if (err) console.error('[VFS] Error al sincronizar IDBFS:', err);
                else console.log('[VFS] IDBFS sincronizado con IndexedDB.');
            });
        }
    );
#endif
}
