import React from 'react';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Header,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {withNavigation} from 'react-navigation';

const styles = StyleSheet.create({
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

class QrCode extends React.Component {
  onSuccess = e => {
    console.log(e);
    const data = e.data;
    this.props.navigation.navigate('AddFriend', {
      receiverPublicKey: data,
    });
  };
  render() {
    return (
      <QRCodeScanner
        onRead={this.onSuccess}
        topContent={null}
        bottomContent={
          <TouchableOpacity style={styles.buttonTouchable}>
            <Text style={styles.buttonText}>OK. Got it!</Text>
          </TouchableOpacity>
        }
      />
    );
  }
}

export default withNavigation(QrCode);
