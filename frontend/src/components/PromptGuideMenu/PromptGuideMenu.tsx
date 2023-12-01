import React, { useState, useEffect } from 'react';
import styles from './PromptGuideMenu.module.css';

// Import the guide text from the file
import promptingGuideText from './prompting_guide.txt';

interface PromptGuideMenuProps {
  // Define any props you might need here
}

export const PromptGuideMenu: React.FC<PromptGuideMenuProps> = (props) => {
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [guideContent, setGuideContent] = useState<string>('');

  // Load the guide content when the component mounts
  useEffect(() => {
    // You can fetch the guide content from the text file
    fetch(promptingGuideText)
      .then((response) => response.text())
      .then((text) => setGuideContent(text))
      .catch((error) => console.error('Failed to load guide:', error));
  }, []);

  const toggleGuideVisibility = () => {
    setIsGuideVisible(!isGuideVisible);
  };

  return (
    <div className={styles.PromptGuideMenu}>
      <button className={styles.commandButton} onClick={toggleGuideVisibility}>
        Prompt Guide
      </button>
      {isGuideVisible && (
        <div className={styles.GuideContent}>
          {/* Display the guide content */}
          <p dangerouslySetInnerHTML={{ __html: guideContent }} />
        </div>
      )}
    </div>
  );
};