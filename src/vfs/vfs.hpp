#pragma once

#include <string>
#include <vector>
#include <unordered_map>

class VirtualFileSystem {
public:
    VirtualFileSystem();
    ~VirtualFileSystem();

    bool init();
    bool mountMpq(const std::string& path);
    bool fileExists(const std::string& path);
    std::vector<uint8_t> readFile(const std::string& path);

    // Guardado de personaje (.d2s)
    bool saveCharacterFile(const std::string& heroName, const std::vector<uint8_t>& data);
    std::vector<uint8_t> loadCharacterFile(const std::string& heroName);

    void syncSaveDirectory();

private:
    std::string m_savePath;
    std::vector<std::string> m_mountedArchives;
};
