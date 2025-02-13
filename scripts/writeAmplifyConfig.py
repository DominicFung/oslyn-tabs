import sys
import json

def writeAmplifyConfig(input_file, output_file="src/amplifyconfiguration.json"):
    try:
        with open(input_file, "r") as f:
            data = json.load(f)
        
        config = {}

        # Perform some JSON manipulation (example: adding a new key-value pair)
        config["aws_project_region"] = data["oslynstudio-AppsyncStack"]["StackRegion"]
        config["aws_appsync_graphqlEndpoint"] = data["oslynstudio-AppsyncStack"]["awsAppsyncApiEndpoint"]
        config["aws_appsync_region"] = data["oslynstudio-AppsyncStack"]["awsAppsyncRegion"]
        config["aws_appsync_authenticationType"] = data["oslynstudio-AppsyncStack"]["awsAppsyncAuthenticationType"]
        config["aws_appsync_apiKey"] = data["oslynstudio-AppsyncStack"]["awsAppsyncApiKey"]
        
        with open(output_file, "w") as f:
            json.dump(config, f, indent=4)
        
        print(f"Modified data saved to {output_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python writeAmplifyConfig.py <input_json_file>")
    else:
        writeAmplifyConfig(sys.argv[1])