cmake_minimum_required(VERSION 3.22.1)

project(v12codeterminal LANGUAGES CXX)

add_library(ghostty-vt SHARED IMPORTED)
set_target_properties(
  ghostty-vt
  PROPERTIES IMPORTED_LOCATION
             "${CMAKE_CURRENT_SOURCE_DIR}/../jniLibs/${ANDROID_ABI}/libghostty-vt.so"
)

add_library(v12codeterminal SHARED v12code_terminal_jni.cpp)

target_include_directories(
  v12codeterminal
  PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/../../../../Vendor/libghostty-vt/include"
)

target_link_options(
  v12codeterminal PRIVATE "-Wl,-z,common-page-size=16384" "-Wl,-z,max-page-size=16384"
)

target_link_libraries(v12codeterminal PRIVATE ghostty-vt log)
