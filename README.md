
# Installation in managed Expo projects

### Add the package to your npm dependencies

```
npx expo install expo-httpserver
```

### Add the following properties in app.json

```
{
  "expo": {

    ...

    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          },
          "android": {
            "packagingOptions": {
              "exclude": ["META-INF/*"]
            }
          }
        }
      ]
    ]
    
    ...


  }
}
```

# Installation in bare React Native projects

Installation instructions for React Native projects are not available yet.
