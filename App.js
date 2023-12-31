import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {Audio} from 'expo-av'
import * as FileSystem from 'expo-file-system'
import { StyleSheet, TouchableOpacity, Text, View, Image, ToastAndroid, Modal, TextInput, Pressable, PanResponder } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';


const IGBO_API_URL = "https://api-inference.huggingface.co/models/AstralZander/xlsr-finetune-igbo"
const YORUBA_API_URL = "https://api-inference.huggingface.co/models/steja/whisper-small-yoruba"
const HAUSA_API_URL = "https://api-inference.huggingface.co/models/DrishtiSharma/whisper-large-v2-hausa"

const YOR_ENG_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-yo-en"
const HAU_ENG_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ha-en"
const IGB_ENG_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-ig-en"

const languages = ["Hausa", "Yoruba", "Igbo"]
const recordingsDir = FileSystem.documentDirectory + 'recordings/'

const ensureDirExists = async () =>{
  const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

  if(!dirInfo.exists){
    await FileSystem.makeDirectoryAsync(recordingsDir, {intermediates: true})
  }
}

export default function App(props) {
  const [timeForInactivityInSecond, setTimeForInactivityInSecond] = useState(5)
  const [loading, setLoading] = useState(null)
  const [recording, setRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState(null)
  const [audioPermissions, setAudioPermissions] = useState(null)
  const [language, setLanguage] = useState(null)
  const [modalVisible, setModalVisible] = useState(false);

    function initialCalls(){
      queryHau("sample1.flac").then((response) => {
        console.log(JSON.stringify(response));
      });
      queryIgb("sample1.flac").then((response) => {
        // console.log(JSON.stringify(response));
      });
      queryYor("sample1.flac").then((response) => {
        // console.log(JSON.stringify(response));
      });

      queryHAEN({"inputs": "Kana"}).then((response) => {
        console.log(JSON.stringify(response));
      });

      queryYREN({"inputs": "Ogun"}).then((response) => {
        // console.log(JSON.stringify(response));
      });

      queryIGEN({"inputs": "Chidi"}).then((response) => {
        // console.log(JSON.stringify(response));
      });
    }

    useEffect(() => {
      initialCalls()
    }, [])
    

    async function queryYor(filename) {
      const response = await fetch(
        YORUBA_API_URL,
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: filename,
        }
      );
      const result = await response.json();
      return result;
    }

    async function queryHau(filename) {
      const response = await fetch(
        HAUSA_API_URL,
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: filename,
        }
      );
      const result = await response.json();
      return result;
    }

    async function queryIgb(filename) {
      const response = await fetch(
        IGBO_API_URL,
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: filename,
        }
      );
      const result = await response.json();
      return result;
    }

    async function queryHAEN(data) {
      const response = await fetch(
        HAU_ENG_URL,
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      return result;
    }

    async function queryYREN(data) {
      const response = await fetch(
        YOR_ENG_URL,
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      return result;
    }

    async function queryIGEN(data) {
      const response = await fetch(
        IGB_ENG_URL,
        {
          headers: { Authorization: "Bearer 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" },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      return result;
    }
    
 

  useEffect(() => {
    async function getPermission() {
      await Audio.requestPermissionsAsync().then((permission) =>{
        setAudioPermissions(permission.granted)
      }).catch(error =>{
        console.log(error)
      })
    }

    getPermission()
  
    return () => {
      if (recording){
        stopRecording()
      }
    }
  }, [])

  function showToast(message) {
    ToastAndroid.show(message, ToastAndroid.LONG);
  }

  
  function handleLanguageSelect(language){
    setLanguage(language)
  }
  async function startRecording() {
    try {
      if (audioPermissions) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playInSilentModeIOS: true
        })
      }

      const newRecording = new Audio.Recording()
      console.log("Recording Started")
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY)
      await newRecording.startAsync()
      setRecording(newRecording)
      setIsRecording(true)
    } catch (error) {
      console.log(`Failed to record ${error}`)
    }
  }


  async function uploadAudio(fileUri) {
    var REQ_URL
    if (language){
      if(language == "Hausa"){
        REQ_URL = HAUSA_API_URL
      }else if(language == "Yoruba"){
        REQ_URL = YORUBA_API_URL
      }else if(language == "Igbo"){
        REQ_URL = IGBO_API_URL
      }
    }else{
      showToast("Please Select a Language First")
    }
    try {
    //   console.log("Sending Request")
    //   console.log(language)
      setLoading(true)
      setModalVisible(true)
      if(REQ_URL != undefined){
        const response = await FileSystem.uploadAsync(REQ_URL, fileUri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { 
            Authorization: "Bearer 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", 
           }
        });
        setLoading(false)
        console.log(response.body)
        if(response.status == 503){
          setLoading(false)
          setModalVisible(false)
          showToast(`Model Loading Please Wait`)
        }
        let result = response.body
        let txtFormat = result.slice(0, result.length);
        let JsonFormat = JSON.parse(txtFormat)

        setTranscript(JsonFormat.text)  
        setLoading(false)
      }else{
        showToast("Please Select a Language First")
      }
    } catch (error) {
      console.log(error);
    }

  }


  async function getTranslation(data) {
      var REQ_URL
      if (language){
        if(language == "Hausa"){
          REQ_URL = HAU_ENG_URL
        }else if(language == "Yoruba"){
          REQ_URL = YOR_ENG_URL
        }else if(language == "Igbo"){
          REQ_URL = IGB_ENG_URL
        }
      }
    const response = await fetch(
      REQ_URL,
      {
        headers: { Authorization: "Bearer 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" },
        method: "POST",
        body: data,
      }
    );
    if(response.status == 503){
      setLoading(false)
      showToast(`Model Loading Please Wait`)
    }
    const result = await response.json();
    console.log(result)
    if(result[0].translation_text){  
      setTranscript(result[0].translation_text)
    }
}

  async function stopRecording() {
    try{
      console.log('Stopping Recording')
      await recording.stopAndUnloadAsync()
      const recordingUri = recording.getURI()
      
      const fileName = `recording-${Date.now()}.mp3`
      await ensureDirExists()
      const dest = recordingsDir + fileName
      await FileSystem.moveAsync({ from: recordingUri, to: dest })
      
      setLoading(true)
      uploadAudio(dest)

      //Playing the Audio Recording
      // const playbackObject = new Audio.Sound()
      // await playbackObject.loadAsync({uri: FileSystem.documentDirectory + 'recordings/' + `${fileName}`})
      // await playbackObject.playAsync()

      setRecording(null)
      setIsRecording(false)

    } catch (error){
      console.log(`Failed to Stop Recording ${error}`)
    }
  }

  async function handleRecordBtnPress(){
    if(language){
      if(recording){
        const audioUri = await stopRecording(recording)
        if (audioUri){
          console.log(`Saved file to ${audioUri}`)
        }
      } else {
        await startRecording()
      }
    }else{
      showToast("Please Select a Language First")
    }
  }


  return (
    <View style={styles.container} 
    // {...panResponder.panHandlers}
    >
    <View>
      {isRecording?
      <Text style={styles.statusTxt}>Recording Audio</Text>
      : null }
    </View>

      <View style={styles.select}>
        <RNPickerSelect
            onValueChange={(language) => handleLanguageSelect(language)}
            items={[
                { label: "Hausa", value: "Hausa" },
                { label: "Yoruba", value: "Yoruba" },
                { label: "Igbo", value: "Igbo" }
            ]}
          style={pickerSelectStyles}
        />
      </View>
      <View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
            setModalVisible(!modalVisible);
          }}>
          <View style={styles.centeredView}>
              <View style={styles.modalView}>
                {!loading?
                  <>
                  <View style={styles.buttonView}>
                      <Pressable
                        style={styles.buttonClose}
                        onPress={() => {
                          setModalVisible(false)
                          setLoading(false)
                          setTranscript(null)
                          }}>
                        <Image style={styles.closeIcon} source={require('./assets/cancel.png')}/>
                      </Pressable>
                    </View>
                    <TextInput
                      style={styles.transcriptInput}
                      multiline={true}
                      numberOfLines={4}
                      onChangeText={(text) => setTranscript(text)}
                      value={transcript}
                      />
                      <Pressable
                        style={styles.buttonTranslate}
                        onPress={() => {
                          getTranslation(transcript)
                          }}>
                        <Text style={styles.textStyle}>Translate</Text>
                      </Pressable>
                  </>
                :
                  <>
                    <View style={styles.buttonView}>
                      <Pressable
                        style={styles.buttonClose}
                        onPress={() => {
                          setModalVisible(false)
                          setLoading(false)
                          setTranscript(null)
                          }}>
                        <Image style={styles.closeIcon} source={require('./assets/cancel.png')}/>
                      </Pressable>
                    </View>
                    <View>
                      <Image style={styles.loadingImg} source={require('./assets/work-in-progress.gif')}/>
                    </View>
                  </>
                }
              </View>
          </View>
        </Modal>
      </View>

      <View>
        {!isRecording?
        <TouchableOpacity style={styles.recordBtn} onPress={handleRecordBtnPress}>
          <Image source={require('./assets/microphone.png')}/>
        </TouchableOpacity>
        :
        <TouchableOpacity style={styles.stopRecordBtn} onPress={handleRecordBtnPress}>
            <Image source={require('./assets/stop-button.png')}/>
          </TouchableOpacity>}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  select: {
    borderWidth: 1,
    borderRadius: 5,
    width: "100%"
  },
  recordBtn: {
    backgroundColor: '#00A15B',
    marginTop: 30,
    padding: 20,
    borderRadius: 100
  },
  stopRecordBtn: {
    backgroundColor: '#C80000',
    marginTop: 30,
    padding: 10,
    borderRadius: 100,
  },
  statusTxt: {
    fontSize: 16,
    marginBottom: 30
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    width: "100%",
    height: "100%",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: "90%",
    margin: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  transcriptInput: {
    borderWidth: 1,
    borderColor: "#000",
    width: "95%",
    marginBottom: 10,
    padding: 5,
    margin: 10
  },
  buttonView:{
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    width: "100%"
  },
  buttonClose: {
    padding: 10,
    borderRadius: 5,
    width: 20,
    marginRight: 10
  },
  closeIcon:{
    width: 20,
    height: 20
  },
  buttonTranslate: {
    backgroundColor: '#00A15B',
    padding: 10,
    borderRadius: 5, 
    width: '95%',
    marginBottom: 20
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingImg: {
    width: 50,
    height: 50
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30,
      width: '100%'
  },
  inputAndroid: {
      fontSize: 16,
      color: 'black',
      paddingRight: 30,
      width: '100%'
  }
});