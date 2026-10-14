cmake_minimum_required(VERSION 3.16)
project(Diablo2WebEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Directorios de inclusión
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/core
    ${CMAKE_CURRENT_SOURCE_DIR}/vfs
    ${CMAKE_CURRENT_SOURCE_DIR}/video
)

# Archivos fuente
set(SOURCES
    main.cpp
    core/engine.cpp
    vfs/vfs.cpp
    video/renderer.cpp
)

if(EMSCRIPTEN)
    message(STATUS "Configurando para compilación WebAssembly con Emscripten")

    add_executable(d2engine ${SOURCES})

    # Flags específicas de Emscripten para Diablo II WebAssembly
    set_target_properties(d2engine PROPERTIES
        OUTPUT_NAME "d2engine"
        SUFFIX ".js"
    )

    target_link_options(d2engine PRIVATE
        "-sUSE_SDL=2"
        "-sALLOW_MEMORY_GROWTH=1"
        "-sINITIAL_MEMORY=536870912"       # 512 MB
        "-sMAXIMUM_MEMORY=2147483648"      # 2 GB
        "-sASYNCIFY=1"
        "-sFORCE_FILESYSTEM=1"
        "-lidbfs.js"
        "-sEXPORTED_RUNTIME_METHODS=['ccall','cwrap','FS']"
        "-sENVIRONMENT='web,worker'"
        "-O3"
    )

    # Copiar automáticamente el binario compilado a la carpeta public/
    set_target_properties(d2engine PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/../public"
    )

else()
    message(STATUS "Configurando para compilación Nativa (PC)")

    find_package(SDL2 REQUIRED)
    include_directories(${SDL2_INCLUDE_DIRS})

    add_executable(d2engine ${SOURCES})
    target_link_libraries(d2engine PRIVATE ${SDL2_LIBRARIES})
endif()
