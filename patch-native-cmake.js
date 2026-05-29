const fs = require('fs');
const path = require('path');

const patches = [
  {
    file: 'node_modules/react-native-screens/android/CMakeLists.txt',
    find: 'target_link_libraries(rnscreens\n    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    fbjni::fbjni\n    android\n)',
    replace: 'target_link_libraries(rnscreens\n    ReactAndroid::reactnative\n    ReactAndroid::jsi\n    fbjni::fbjni\n    android\n    c++\n)',
  },
  {
    file: 'node_modules/react-native-worklets/android/CMakeLists.txt',
    find: 'target_link_libraries(worklets android log ReactAndroid::reactnative\n                      ReactAndroid::jsi fbjni::fbjni)',
    replace: 'target_link_libraries(worklets android log ReactAndroid::reactnative\n                      ReactAndroid::jsi fbjni::fbjni\n                      c++)',
  },
  {
    file: 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake',
    find: 'target_link_libraries(${CMAKE_PROJECT_NAME}\n        fbjni                               # via 3rd party prefab\n        jsi                                 # prefab ready\n        reactnative                         # prefab ready\n)',
    replace: 'target_link_libraries(${CMAKE_PROJECT_NAME}\n        fbjni                               # via 3rd party prefab\n        jsi                                 # prefab ready\n        reactnative                         # prefab ready\n        c++                                 # C++ standard library\n)',
  },
  {
    file: 'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake',
    find: '        foreach(autolinked_library ${AUTOLINKED_LIBRARIES})\n            target_link_libraries(${autolinked_library} common_flags)\n        endforeach()',
    replace: '        foreach(autolinked_library ${AUTOLINKED_LIBRARIES})\n            target_link_libraries(${autolinked_library} common_flags)\n            target_link_libraries(${autolinked_library} c++)\n        endforeach()',
  },
  {
    file: 'node_modules/react-native-gesture-handler/android/src/main/jni/cpp-adapter.cpp',
    find: 'auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);\n                bool isViewFlatteningDisabled = shadowNode->getTraits().check(\n                        ShadowNodeTraits::FormsStackingContext);\n\n                // This is done using component names instead of type checking because\n                // of duplicate symbols for RN types, which prevent RTTI from working.\n                const char *componentName = shadowNode->getComponentName();',
    replace: 'auto shadowNodeList = shadowNodeListFromValue(runtime, arguments[0]);\n                if (shadowNodeList->empty()) {\n                    return jsi::Value::null();\n                }\n                auto shadowNode = shadowNodeList->at(0).get();\n                bool isViewFlatteningDisabled = shadowNode->getTraits().check(\n                        ShadowNodeTraits::FormsStackingContext);\n\n                // This is done using component names instead of type checking because\n                // of duplicate symbols for RN types, which prevent RTTI from working.\n                const char *componentName = shadowNode->getComponentName();',
  },
];

for (const p of patches) {
  const fullPath = path.join(__dirname, p.file);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${p.file} not found`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(p.replace)) {
    console.log(`OK: ${p.file} already patched`);
    continue;
  }
  if (!content.includes(p.find)) {
    console.log(`WARN: ${p.file} - pattern not found, may need manual patch`);
    continue;
  }
  content = content.replace(p.find, p.replace);
  fs.writeFileSync(fullPath, content);
  console.log(`PATCHED: ${p.file}`);
}
