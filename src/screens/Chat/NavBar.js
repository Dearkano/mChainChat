/* eslint jsx-a11y/accessible-emoji: 0 */
import React from 'react';
import {Text} from 'react-native';
import NavBar, {NavTitle, NavButton} from 'react-native-nav';
import Icons from 'react-native-vector-icons/FontAwesome';
import {withNavigation} from 'react-navigation';

class CustomNavBar extends React.Component {
    render(){
        return (
            <NavBar>
              <NavButton onPress={()=>this.props.navigation.navigate('Friend')}>
                <Icons name="arrow-left" size={20} color="#444" />
              </NavButton>
              <NavTitle>
                <Text>{this.props.user}</Text>
              </NavTitle>
              <NavButton />
            </NavBar>
          );
    }
}

export default withNavigation(CustomNavBar)