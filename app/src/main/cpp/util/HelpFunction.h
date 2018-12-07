#ifndef VULKANEXBASE_HELPFUNCTION_H
#define VULKANEXBASE_HELPFUNCTION_H
#include <vulkan/vulkan.h>
#include <vector>
bool memoryTypeFromProperties(VkPhysicalDeviceMemoryProperties& memoryProperties, uint32_t typeBits, VkFlags requirements_mask, uint32_t *typeIndex);
float toRadians(float degree);
float toDegrees(float radian);
std::vector<float> generateTexCoor(int bw, int bh);
std::vector<float> generateSkyTexCoor(int bw, int bh);
#endif
