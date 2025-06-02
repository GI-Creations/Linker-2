import React from 'react';
import { Button } from '../components/ui/button';

const Chat = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-6">
      <h1 className="text-2xl font-bold mb-4">Button Variants Demo</h1>
      <div className="flex gap-4">
        {/* Primary Button */}
        <Button variant="default" className="btn-primary">
          Try now
        </Button>
        {/* Secondary Button */}
        <Button variant="secondaryPill">
          All
        </Button>
        {/* Tertiary Button */}
        <Button variant="tertiary">
          Vision
        </Button>
      </div>
    </div>
  );
};

export default Chat;
