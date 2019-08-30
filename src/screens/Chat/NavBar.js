/* eslint jsx-a11y/accessible-emoji: 0 */
import React from 'react';
import {Text} from 'react-native';
import NavBar, {NavTitle, NavButton} from 'react-native-nav';

export default function NavBarCustom(props) {
  console.log('---');
  console.log(props);
  return (
    <NavBar>
      <NavButton />
      <NavTitle> <Text>{props.user}</Text> </NavTitle> 
      <NavButton />
    </NavBar>
  );
}
