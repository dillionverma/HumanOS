import * as coco from "@tensorflow-models/coco-ssd";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { Camera } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

const TensorCamera = cameraWithTensors(Camera);
const textureDims =
  Platform.OS === "ios"
    ? { width: 1080, height: 1920 }
    : { width: 1600, height: 1200 };
const tensorDims = { width: 200, height: 200 };

export default function App() {
  const [image, setImage] = useState();
  const [prediction, setPrediction] = useState();
  const [predictionFound, setPredictionFound] = useState();
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((prev) => !prev);

  const [cocoModel, setCocoModel] = useState();
  const [mobilenetModel, setMobilenetModel] = useState(null);
  const [frameworkReady, setFrameworkReady] = useState(false);

  let requestAnimationFrameId = 0;
  //performance hacks (Platform dependent)

  useEffect(() => {
    if (!frameworkReady) {
      (async () => {
        const { status } = await Camera.requestPermissionsAsync();
        await tf.ready(); // preparing TensorFlow
        setMobilenetModel(await mobilenet.load()); // preparing mobilenet model
        setCocoModel(await coco.load()); // preparing COCO-SSD model
        setFrameworkReady(true);
      })();
    }
  }, []);

  const getPrediction = async (tensor) => {
    if (!tensor) {
      return;
    }

    //topk set to 1
    const prediction = await mobilenetModel.classify(tensor, 1);
    // const prediction = await cocoModel.classify(tensor);

    setPrediction(prediction);
    console.log(`prediction: ${JSON.stringify(prediction)}`);

    if (!prediction || prediction.length === 0) {
      return;
    }

    // //only attempt translation when confidence is higher than 20%
    // if (prediction[0].probability > 0.2) {
    //   //stop looping!
    //   cancelAnimationFrame(requestAnimationFrameId);
    //   setPredictionFound(true);
    // }
  };

  /*-----------------------------------------------------------------------
  Helper function to handle the camera tensor streams. Here, to keep up reading input streams, we use requestAnimationFrame JS method to keep looping for getting better predictions (until we get one with enough confidence level).
  More info on RAF: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  -------------------------------------------------------------------------*/
  const handleCameraStream = (imageAsTensors) => {
    const loop = async () => {
      const nextImageTensor = await imageAsTensors.next().value;
      await getPrediction(nextImageTensor);
      requestAnimationFrameId = requestAnimationFrame(loop);
    };
    if (!predictionFound) loop();
  };

  // const detectObjects = async (image) => {
  //   try {
  //     const imageAssetPath = Image.resolveAssetSource(image);

  //     console.log(image);
  //     const response = await tfFetch(
  //       imageAssetPath.uri,
  //       {},
  //       { isBinary: true }
  //     );
  //     const rawImageData = await response.arrayBuffer();
  //     const imageTensor = imageToTensor(rawImageData);
  //     const predictions = await model.detect(imageTensor);

  //     // this.setState({ predictions: predictions });
  //     setPredictions(predictions);
  //     // this.setState({ image_uri: imageAssetPath.uri })

  //     console.log("----------- predictions: ", predictions);
  //   } catch (error) {
  //     console.log("Exception Error: ", error);
  //   }
  // };

  // const selectImage = async () => {
  //   try {
  //     let response = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.All,
  //       allowsEditing: true,
  //       aspect: [4, 3],
  //     });

  //     if (!response.cancelled) {
  //       const source = { uri: response.uri };
  //       // set;
  //       setImage(source);
  //       // this.setState({ image: source });
  //       detectObjects(source);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const renderPrediction = (prediction, index) => {
  //   const pclass = prediction.class;
  //   const score = prediction.score;
  //   const x = prediction.bbox[0];
  //   const y = prediction.bbox[1];
  //   const w = prediction.bbox[2];
  //   const h = prediction.bbox[3];

  //   return (
  //     <View style={styles.welcomeContainer}>
  //       <Text key={index} style={styles.text}>
  //         Prediction: {pclass} {", "} Probability: {score} {", "} Bbox: {x}{" "}
  //         {", "} {y} {", "} {w} {", "} {h}
  //       </Text>
  //     </View>
  //   );
  // };

  /*-----------------------------------------------------------------------
Helper function to show the Camera View. 

NOTE: Please note we are using TensorCamera component which is constructed on line: 37 of this function component. This is just a decorated expo.Camera component with extra functionality to stream Tensors, define texture dimensions and other goods. For further research:
https://js.tensorflow.org/api_react_native/0.2.1/#cameraWithTensors
-----------------------------------------------------------------------*/
  const renderCameraView = () => {
    return (
      <View style={styles.cameraView}>
        <TensorCamera
          style={styles.camera}
          type={Camera.Constants.Type.back}
          zoom={0}
          cameraTextureHeight={textureDims.height}
          cameraTextureWidth={textureDims.width}
          resizeHeight={tensorDims.height}
          resizeWidth={tensorDims.width}
          resizeDepth={3}
          onReady={(imageAsTensors) => handleCameraStream(imageAsTensors)}
          autorender={true}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* <Button title="Choose Image" onPress={selectImage} /> */}
      <View style={{ height: 100 }}>
        <Text>{JSON.stringify(prediction)}</Text>
      </View>

      <TensorCamera
        style={styles.camera}
        type={
          isEnabled ? Camera.Constants.Type.back : Camera.Constants.Type.front
        }
        zoom={0}
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeHeight={tensorDims.height}
        resizeWidth={tensorDims.width}
        resizeDepth={3}
        onReady={(imageAsTensors) => handleCameraStream(imageAsTensors)}
        autorender={true}
      />
      <View
        style={{
          height: 100,
          display: "flex",
          justifyContent: "center",
          // flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text>Camera Orientation</Text>
        <Switch
          // trackColor={{ false: "#767577", true: "#81b0ff" }}
          // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    color: "#134153",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraView: {
    display: "flex",
    // flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    // width: "100%",
    // height: "100%",
    // paddingTop: 10,
  },
  camera: {
    width: 200,
    height: 320,
    zIndex: 1,
    borderWidth: 0,
    borderRadius: 0,
  },
  imageContainer: {
    width: 250,
    height: 250,
    position: "absolute",
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
});
