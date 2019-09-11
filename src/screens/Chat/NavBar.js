/* eslint jsx-a11y/accessible-emoji: 0 */
import React from 'react';
import {Text, View} from 'react-native';
import NavBar, {NavTitle, NavButton} from 'react-native-nav';
import Icons from 'react-native-vector-icons/FontAwesome';
import {withNavigation} from 'react-navigation';
import g from '../../state';
import {Modal, InputItem, Provider} from '@ant-design/react-native';

class CustomNavBar extends React.Component {

  render() {

    return (
      <View>
          <NavBar>
            <NavButton onPress={() => this.props.navigation.navigate('Friend')}>
              <Icons name="arrow-left" size={20} color="#444" />
            </NavButton>
            <NavTitle>
              <Text>{this.props.user}</Text>
            </NavTitle>
            <NavButton onPress={() => this.props.showModal()}>
              <Icons name="bookmark" size={20} color="#444" />
            </NavButton>
          </NavBar>
      </View>
    );
  }
}

export default withNavigation(CustomNavBar);
