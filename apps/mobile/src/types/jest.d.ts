declare namespace NodeJS {
  interface Global {
    testUtils: {
      createMockState: (overrides?: Record<string, any>) => Record<string, any>;
      createMockQuest: (overrides?: Record<string, any>) => Record<string, any>;
      createMockUserQuest: (overrides?: Record<string, any>) => Record<string, any>;
    };
  }
}

declare var global: NodeJS.Global & typeof globalThis;

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { Component } from 'react';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { Component } from 'react';
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export default class Icon extends Component<IconProps> {}
}
