import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
// Assuming SEO is a component you still need
import SEO from "../components/SEO";

import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { Spinner } from "@nextui-org/spinner";
import { v4 as uuidv4 } from "uuid";
import Lottie from "lottie-react";

// Assuming these paths are correct
import happy from "../assets/lotte/happy.json";
import sad from "../assets/lotte/sad.json";

// --- Constants ---

// Move the long SEO description/keywords out of the component for cleanliness,
// or use a utility/config file if it's used elsewhere.
const SEO_KEYWORDS = "watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online";

// Helper function for the main logic
const generateToken = () => uuidv4();

export default function Token() {
  const [loading, setLoading] = useState(true);
  // Use a string or enum for status for more clarity (e.g., 'success', 'error', null)
  const [tokenCreationStatus, setTokenCreationStatus] = useState(null); 
  const [countdown, setCountdown] = useState(10);
  
  // Destructure environment variables once
  const SHORTNER_TIME_HOURS = import.meta.env.VITE_SHORTNER_TIME;
  const SITENAME = import.meta.env.VITE_SITENAME;

  const { tokenID } = useParams();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  // Calculate expiration time in milliseconds
  // SHORTNER_TIME_HOURS * 60 minutes/hr * 60 seconds/min * 1000 ms/sec
  const EXPIRATION_MS = SHORTNER_TIME_HOURS * 60 * 60 * 1000;

  // --- Functions ---

  // Use useCallback for functions passed to useEffect dependencies
  const fetchUserToken = useCallback(async (uid) => {
    if (!uid) return false;
    try {
      const userTokenDoc = await getDoc(doc(db, "tokens", uid));
      if (userTokenDoc.exists()) {
        // Only return the token value
        return userTokenDoc.data().token || false;
      }
      return false;
    } catch (error) {
      console.error("Error fetching/verifying token:", error);
      return false;
    }
  }, []); // Empty dependency array as it only uses uid passed in

  const createAndStoreToken = useCallback(async () => {
    if (!userId || !tokenID) {
        setLoading(false);
        return;
    }
    
    try {
      const existingToken = await fetchUserToken(userId);
      
      // 1. Check if the token from the URL matches the one currently stored
      if (existingToken === tokenID) {
        const expiresAt = Date.now() + EXPIRATION_MS;
        const newToken = generateToken();
        
        await setDoc(doc(db, "tokens", userId), { 
            token: newToken, 
            expiresAt 
        }, { merge: false }); // Use merge: false to fully overwrite for security/clarity

        setTokenCreationStatus('success');
      } else {
        // Mismatch/Invalid token flow
        setTokenCreationStatus('error');
      }
    } catch (error) {
      console.error("Error creating/storing token:", error);
      setTokenCreationStatus('error');
    } finally {
      setLoading(false);
    }
  }, [userId, tokenID, EXPIRATION_MS, fetchUserToken]);

  // --- Effects ---

  // Effect 1: Trigger token creation/verification
  useEffect(() => {
    createAndStoreToken();
  }, [createAndStoreToken]); // Dependency array includes the stable callback

  // Effect 2: Countdown timer and window close logic
  useEffect(() => {
    if (!loading) { // Only start the timer once the loading is complete
      const countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(countdownInterval);
            // Use a slight delay before closing to ensure UI updates
            setTimeout(() => window.close(), 200); 
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [loading]); // Re-run when loading state changes

  // --- Render Logic ---

  // Helper function to render content based on status
  const renderContent = () => {
    if (loading) {
      return (
        <Spinner
          label="Verifying Token..."
          labelColor="warning"
          color="warning"
          // Use full viewport height for centering
          className="w-full h-screen" 
        />
      );
    }

    const isSuccess = tokenCreationStatus === 'success';
    const animationData = isSuccess ? happy : sad;
    const titleText = isSuccess 
      ? `Done! Now enjoy the echo without limit for ${SHORTNER_TIME_HOURS} hr.`
      : "Sorry, there was an issue with the token creation.";

    return (
      <div className="flex flex-col justify-center gap-5 items-center mt-20 p-4">
        <Lottie
          animationData={animationData}
          // Use fixed size classes for better control
          className="w-80 h-80 md:w-96 md:h-96" 
          loop={true}
          autoplay={true}
        />
        <div className="flex flex-col gap-2 items-center justify-center text-center">
          <h1 className="text-xl font-semibold">{titleText}</h1>
          <h2 className="text-lg">Closing in: {countdown} seconds</h2>
        </div>
      </div>
    );
  };

  return (
    <div className="text-primaryTextColor min-h-screen flex items-start justify-center">
      <SEO
        title={SITENAME}
        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}
        name={SITENAME}
        type="text/html"
        keywords={SEO_KEYWORDS}
        link={`https://${SITENAME}.com`}
      />
      
      {/* Render based on state */}
      {renderContent()}
    </div>
  );
}
