import React from 'react';
import {Composition} from 'remotion';
import {Main, TOTAL, FPS} from './Main';

export const RemotionRoot: React.FC = () => (
  <Composition id="Main" component={Main} durationInFrames={Math.ceil(TOTAL * FPS)} fps={FPS} width={1920} height={1080} />
);
