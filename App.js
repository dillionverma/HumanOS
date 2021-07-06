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
  const [predictions, setPredictions] = useState();
  const [predictionFound, setPredictionFound] = useState();
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((prev) => !prev);

  const [cocoModel, setCocoModel] = useState();
  const [mobilenetModel, setMobilenetModel] = useState(null);
  const [frameworkReady, setFrameworkReady] = useState(false);
  // const canvasRef = useRef(null);

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

  // // https://github.com/cnebs/object-detector/blob/master/src/App.js
  // const buildRectangle = (discriminations) => {
  //   // !!!!
  //   // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
  //   // !!!!

  //   const ctx = canvasRef.current.getContext("2d"); // define the rectangle
  //   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  //   // Build the rectangle styling
  //   ctx.lineWidth = 2;
  //   ctx.textBaseline = "bottom";
  //   ctx.font = "14px sans-serif";

  //   discriminations.forEach((guess) => {
  //     // Draw the rectangle around each object prediction
  //     const guessText = `${guess.class}`;

  //     ctx.strokeStyle = classData[guessText]; // give each guess.class's box a unique color

  //     const textWidth = ctx.measureText(guessText).width;
  //     const textHeight = parseInt(ctx.font, 10);
  //     ctx.strokeRect(
  //       guess.bbox[0],
  //       guess.bbox[1],
  //       guess.bbox[2],
  //       guess.bbox[3]
  //     );
  //     ctx.fillStyle = "white";
  //     ctx.fillRect(
  //       guess.bbox[0] - ctx.lineWidth / 2, // place the label on the top left of the box
  //       guess.bbox[1],
  //       textWidth + ctx.lineWidth,
  //       -textHeight
  //     );
  //     ctx.fillStyle = "#fc0303"; // color the label text red, always
  //     ctx.fillText(guessText, guess.bbox[0], guess.bbox[1]);
  //   });
  // };

  const getPrediction = async (tensor) => {
    if (!tensor) {
      return;
    }

    // const prediction = await mobilenetModel.classify(tensor, 1);
    const prediction = await cocoModel.detect(tensor, 20, 0.2);

    setPredictions(prediction);
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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* <Button title="Choose Image" onPress={selectImage} /> */}
      <View style={{ height: 100, textAlign: "left" }}>
        {predictions &&
          predictions.map((prediction) => (
            <Text style={{ textAlign: "left" }}>
              {prediction.class}: {prediction.score.toFixed(3)}
            </Text>
          ))}
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
      >
        <View
          style={{
            width: 100,
            height: 100,
            backgroundColor: "red",
            zIndex: 9999,
          }}
        ></View>
      </TensorCamera>
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
