import { useRef, useState, useEffect, useCallback } from "react";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton } from "@fluentui/react";
import { SparkleFilled } from "@fluentui/react-icons";

import styles from "./Chat.module.css";
import { FilenameMenu } from "../../components/FilenameMenu";
import hierarchy from "../../components/BoxMenu/hierarchy.json";
import { BoxMenu } from "../../components/BoxMenu";
import { PromptGuideMenu } from '../../components/PromptGuideMenu';
//import { ConversationIdMenu } from "../../components/ConversationIdMenu";
import { UsuarioIdMenu } from "../../components/UsuarioIdMenu";
import { SearchServiceMenu } from "../../components/SearchServiceMenu";
import { SelectedHistoryMenu } from "../../components/SelectedHistoryMenu";
import { chatApiGpt, Approaches, AskResponse, ChatRequest, ChatRequestGpt, ChatTurn } from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { ClearChatButton } from "../../components/ClearChatButton";
import { getTokenOrRefresh } from '../../components/QuestionInput/token_util';
import { SpeechConfig, AudioConfig, SpeechSynthesizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const userLanguage = navigator.language;
let error_message_text = '';
if (userLanguage.startsWith('pt')) {
    error_message_text = 'Desculpe, tive um problema técnico com a solicitação. Por favor informar o erro a equipe de suporte. ';
} else if (userLanguage.startsWith('es')) {
    error_message_text = 'Lo siento, yo tuve un problema con la solicitud. Por favor informe el error al equipo de soporte. ';
} else {
    error_message_text = "I'm sorry, I had a problem with the request. Please report the error to the support team. ";
}

const Chat = () => {
    // speech synthesis is disabled by default
    const speechSynthesisEnabled = false;

    const [placeholderText, setPlaceholderText] = useState('');
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] = useState<boolean>(false);

    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[user: string, response: AskResponse][]>([]);

    const [userId, setUserId] = useState<string>("");
    const triggered = useRef(false);


    ///////////////////////////////////// Funcion makeApiReuquestGpt - editada por NTT ///////////////////////////////////////////////////////////////

    const makeApiRequestGpt = async (question: string, filterQuery: string, selectedHistory: boolean) => {
      lastQuestionRef.current = question;
      console.log("question", question);
      console.log("userId", userId);
    
      // Log the filters query
      console.log("filterQuery", filterQuery);
    
      error && setError(undefined);
      setIsLoading(true);
      setActiveCitation(undefined);
      setActiveAnalysisPanelTab(undefined);
    
      try {
        const history: ChatTurn[] = answers.map(a => ({ user: a[0], bot: a[1].answer }));
        const request = {
          history: [...history, { user: question, bot: undefined }],
          approach: Approaches.ReadRetrieveRead,
          conversation_id: userId,
          query: question,
          filterQuery: filterQuery, // Include the filters query here
          customEntries: {
            usuarioIds: UsuarioId,
            searchService: selectedSearchService,
          }, 
          selectedHistory: includeHistory,         
          overrides: {
            promptTemplate: promptTemplate.length === 0 ? undefined : promptTemplate,
            excludeCategory: excludeCategory.length === 0 ? undefined : excludeCategory,
            top: retrieveCount,
            semanticRanker: useSemanticRanker,
            semanticCaptions: useSemanticCaptions,
            suggestFollowupQuestions: useSuggestFollowupQuestions
          }
        };
        const result = await chatApiGpt(request, filterQuery, selectedHistory);
        console.log(result);
        console.log(result.answer);
        setAnswers([...answers, [question, result]]);
        setUserId(result.conversation_id);
    
        // Voice Synthesis
        if (speechSynthesisEnabled) {
          const tokenObj = await getTokenOrRefresh();
          const speechConfig = SpeechConfig.fromAuthorizationToken(
            tokenObj.authToken,
            tokenObj.region
          );
          const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
          speechConfig.speechSynthesisLanguage = tokenObj.speechSynthesisLanguage;
          speechConfig.speechSynthesisVoiceName = tokenObj.speechSynthesisVoiceName;
          const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    
          synthesizer.speakTextAsync(result.answer.replace(/ *\[[^)]*\] */g, ""), function (result) {
            if (result.reason === ResultReason.SynthesizingAudioCompleted) {
              console.log("synthesis finished.");
            } else {
              console.error("Speech synthesis canceled, " + result.errorDetails + "\nDid you update the subscription info?");
            }
            synthesizer.close();
          },
          function (err) {
            console.trace("err - " + err);
            synthesizer.close();
          });
        }
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const clearChat = () => {
        lastQuestionRef.current = "";
        error && setError(undefined);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        setAnswers([]);
        setUserId("");
    };

    useEffect(() => {
        chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" });
        if (triggered.current === false) {
            triggered.current = true;
            console.log(triggered.current);
        }
        const language = navigator.language;
        if (language.startsWith('pt')) {
          setPlaceholderText('Escreva aqui sua pergunta');
        }if (language.startsWith('es')) {
          setPlaceholderText('Escribe tu pregunta aqui');
        } else {
          setPlaceholderText('Write your question here');
        }        
    }, [isLoading]);

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSuggestFollowupQuestions(!!checked);
    };

    /////////////////// Editada por NTT - No se usa en el frontend porque no estan habilitadas las preguntas ejemplo ///////////////////////////////////

    const onExampleClicked = (example: string, selectedHistory: boolean) => {
      const question = example;
      const filterQuery = constructFilterQuery(
        selectedAreaOptions,
        selectedCategoriaOptions,
        selectedSubcategoriaOptions,
        userEntries
      ); // Construct the filters query
    
      makeApiRequestGpt(question, filterQuery, selectedHistory );
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const onShowCitation = (citation: string, index: number) => {
        
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveCitation(citation);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };

    ///////////////////////////////////  addons de NTT - Menus //////////////////////////////////////////////////////////////////////

    const [selectedAreaOptions, setSelectedAreaOptions] = useState<string[]>(["Area"]);
    const [selectedCategoriaOptions, setSelectedCategoriaOptions] = useState<string[]>(["Categoria"]);
    const [selectedSubcategoriaOptions, setSelectedSubcategoriaOptions] = useState<string[]>(["Subcategoria"]);
    
    const handleMenuChange = (menu: string, selectedOptions: string[]) => {
      switch (menu) {
        case "Area":
          setSelectedAreaOptions(selectedOptions);
          // Additional actions specific to the "Area" menu.
          break;
        case "Categoria":
          setSelectedCategoriaOptions(selectedOptions);
          // Additional actions specific to the "Categoria" menu.
          break;
        case "Subcategoria":
          setSelectedSubcategoriaOptions(selectedOptions);
          // Additional actions specific to the "Subcategoria" menu.
          break;
        default:
          break;
      }
    };
    
    const getOptions = useCallback((menu: string): string[] => {
        switch (menu) {
          case "Area":
            return hierarchy.areas.map((area) => area.name);
          case "Categoria":
            // Check the selected Area options
            const selectedAreas: string[] = selectedAreaOptions;
            const categoryOptions = selectedAreas.flatMap((selectedArea) => {
              const area = hierarchy.areas.find((area) => area.name === selectedArea);
              return area?.categories.map((category) => category.name) || [];
            });
            return categoryOptions;
          case "Subcategoria":
            // Check the selected Area options for Subcategoria
            const selectedAreasSubcategoria: string[] = selectedAreaOptions;
            const selectedCategories: string[] = selectedCategoriaOptions;
            const subcategoryOptions = selectedAreasSubcategoria.flatMap((selectedArea) => {
              const area = hierarchy.areas.find((area) => area.name === selectedArea);
              return area?.categories.flatMap((category) => {
                if (selectedCategories.length === 0 || selectedCategories.includes(category.name)) {
                  return category.subcategories;
                }
                return [];
              }) || [];
            });
            return subcategoryOptions;
          default:
            return [];
        }
      }, [selectedAreaOptions, selectedCategoriaOptions]);
      
      // Validate the data structure in hierarchy
      if (!hierarchy || !hierarchy.areas) {
        console.error("Invalid hierarchy data structure.");
        // Handle the error or provide a fallback
      }
      
      const [userEntries, setUserEntries] = useState<string[]>([]); // State to store user entries

      const handleAddEntry = (entry: string) => {
        // Add the entered keyword or filename to the list of user entries
        setUserEntries([...userEntries, entry]);
      };
    
      const handleRemoveEntry = (entry: string) => {
        // Remove the specified entry from the list of user entries
        const updatedEntries = userEntries.filter((e) => e !== entry);
        setUserEntries(updatedEntries);
      }; 
      
      /////////////////////////////////

      //const [ConversationId, setConversationId] = useState<string[]>([]); // State to store conversation IDs

      //const handleAddConversationId = (entry: string) => {
        // Add the entered keyword or filename to the list of user entries
        //setConversationId([...ConversationId, entry]);
      //};
    
      //const handleRemoveConversationId = (entry: string) => {
        // Remove the specified entry from the list of user entries
        //const updatedConversationId = ConversationId.filter((e) => e !== entry);
        //setConversationId(updatedConversationId);
      //}; 

      ///////////////////////////////////

      const [UsuarioId, setUsuarioId] = useState<string[]>([]); // State to store conversation IDs

      const handleAddUsuarioId = (entry: string) => {
        // Add the entered keyword or filename to the list of user entries
        setUsuarioId([...UsuarioId, entry]);
      };
    
      const handleRemoveUsuarioId = (entry: string) => {
        // Remove the specified entry from the list of user entries
        const updatedUsuarioId = UsuarioId.filter((e) => e !== entry);
        setUsuarioId(updatedUsuarioId);
      };

      const [selectedSearchService, setSelectedSearchService] = useState<string>("CognitiveSearch"); // Initialize the selected search service

      // Function to handle the selection of the search service
      const handleToggleSearchService = (service: string) => {
        setSelectedSearchService(service);
      };

      // List of available search services
      //const searchServices = ["CognitiveSearch", "BigQuery"]; // You can add more services if needed

      const [areMenusVisible, setMenusVisibility] = useState(false); // State to manage menus visibility

      // Toggle menus' visibility
      const toggleMenusVisibility = () => {
        setMenusVisibility(!areMenusVisible);
      };

      const constructFilterQuery = (
        selectedAreas: string[],
        selectedCategories: string[],
        selectedSubcategories: string[],
        userEntries: string[]
      ): string => {
        // Initialize an empty filter query array
        const filterParts = [];
      
        // Check if any areas are selected
        if (selectedAreas.length > 0) {
          // Construct area filter without "Area"
          const areaFilter = selectedAreas
            .filter((area) => area !== "Area") // Filter out "Area"
            .map((area: string) => `area eq '${area}'`)
            .join(' or ');
      
          if (areaFilter) {
            filterParts.push(`(${areaFilter})`);
          }
        }
      
        // Check if any categories are selected
        if (selectedCategories.length > 0) {
          // Construct category filter without "Categoria"
          const categoryFilter = selectedCategories
            .filter((category) => category !== "Categoria") // Filter out "Categoria"
            .map((category: string) => `category eq '${category}'`)
            .join(' or ');
      
          if (categoryFilter) {
            filterParts.push(`(${categoryFilter})`);
          }
        }
      
        // Check if any subcategories are selected
        if (selectedSubcategories.length > 0) {
          // Construct subcategory filter without "Subcategoria"
          const subcategoryFilter = selectedSubcategories
            .filter((subcategory) => subcategory !== "Subcategoria") // Filter out "Subcategoria"
            .map((subcategory: string) => `subcategory eq '${subcategory}'`)
            .join(' or ');
      
          if (subcategoryFilter) {
            filterParts.push(`(${subcategoryFilter})`);
          }
        }
      
        // Check if any user entries are provided
        if (userEntries.length > 0) {
          // Construct user entries filter
          const userEntriesFilter = userEntries.map((entry: string) => `filepath eq '${entry}'`).join(' or ');
          filterParts.push(`(${userEntriesFilter})`);
        }
      
        // Join the filter parts with ' and ' if there are multiple parts
        const filterQuery = filterParts.join(' and ');
      
        return filterQuery; // Return the constructed filter query
      };

      const filterQuery = constructFilterQuery(
        selectedAreaOptions,
        selectedCategoriaOptions,
        selectedSubcategoriaOptions,
        userEntries
      );

      // Define a state to track whether history should be included
      const [includeHistory, setIncludeHistory] = useState(false);

      // Function to handle the selection of history checkbox
      const handleToggleHistory = (selected: boolean) => {
        setIncludeHistory(selected);
      };

      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
      
      return (
        <div className={styles.container}>
          <div className={styles.commandsContainer}>
            <ClearChatButton
              className={styles.commandButton}
              onClick={clearChat}
              disabled={!lastQuestionRef.current || isLoading}
            />
            <button
              className={styles.commandButton} onClick={toggleMenusVisibility}>
              Toggle Menus
            </button>
            <PromptGuideMenu />
          </div>
          <div className={styles.chatRoot}>
            {areMenusVisible && ( // Conditionally render the whole BoxMenu area based on areMenusVisible
              <div className={styles.BoxMenu}>
                {/* SearchServiceMenu */}
                <div className={styles.SearchServiceMenu}>
                  <SearchServiceMenu onToggleSearchService={handleToggleSearchService} />
                </div>
                {/* FilenameMenu */}
                <div className={styles.FilenameMenu}>
                  <FilenameMenu onAddEntry={handleAddEntry} />
                </div>
      
                {/* User Entries */}
                <div className={styles.UserEntriesContainer}>
                  <ul className={styles.FilenameMenu}>
                    {userEntries.map((entry, index) => (
                      <li key={index}>
                        {entry}
                        <button onClick={() => handleRemoveEntry(entry)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
      
                {/* Other BoxMenus go here */}
                <BoxMenu
                  title="Area"
                  options={getOptions("Area")}
                  selectedOptions={selectedAreaOptions}
                  onChange={(selectedOptions) => handleMenuChange("Area", selectedOptions)}
                />
                <BoxMenu
                  title="Categoria"
                  options={getOptions("Categoria")}
                  selectedOptions={selectedCategoriaOptions}
                  onChange={(selectedOptions) => handleMenuChange("Categoria", selectedOptions)}
                  parentSelection="Area"
                />
                <BoxMenu
                  title="Subcategoria"
                  options={getOptions("Subcategoria")}
                  selectedOptions={selectedSubcategoriaOptions}
                  onChange={(selectedOptions) => handleMenuChange("Subcategoria", selectedOptions)}
                  parentSelection="Area"
                />
                {/* SelectedHistory Menu */}
                  <div className={styles.SelectedHistoryMenu}>
                <SelectedHistoryMenu onToggleSelectedHistory={handleToggleHistory} />
                </div>
                {/* UsuarioId Menu */}
                <div className={styles.UsuarioIdMenu}>
                  <UsuarioIdMenu onAddUsuarioId={handleAddUsuarioId} />
                </div>
                {/* UsuarioIdMenu Entries */}
                <div className={styles.UsuarioIdContainer}>
                  <ul className={styles.UsuarioIdMenu}>
                    {UsuarioId.map((entry, index) => (
                      <li key={index}>
                        {entry}
                        <button onClick={() => handleRemoveUsuarioId(entry)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
            </div>             
            )}
                <div className={styles.chatContainer}>
                    {!lastQuestionRef.current ? (
                        <div className={styles.chatEmptyState}>
                            {/* Your empty state content */}
                        </div>
                    ) : (
                        <div className={styles.chatMessageStream}>
                            {answers.map((answer, index) => (
                                <div key={index}>
                                    <UserChatMessage message={answer[0]} />
                                    <div className={styles.chatMessageGpt}>
                                        <Answer
                                            key={index}
                                            answer={answer[1]}
                                            isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
                                            onCitationClicked={c => onShowCitation(c, index)}
                                            onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                            onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                            onFollowupQuestionClicked={(q) => makeApiRequestGpt(q, filterQuery, includeHistory)}
                                            showFollowupQuestions={false}
                                            showSources={true}                                            
                                        />
                                    </div>
                                </div>
                            ))}
                       
                            {isLoading && (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerLoading />
                                    </div>
                                </>
                            )}
                            {error ? (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                    <AnswerError error={error_message_text + error.toString()} onRetry={() => makeApiRequestGpt(lastQuestionRef.current, filterQuery, includeHistory)} />
                                    </div>
                                </>
                            ) : null}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}

                    <div className={styles.chatInput}>
                    <QuestionInput
                      clearOnSend
                      placeholder={placeholderText}
                      disabled={isLoading}
                      onSend={question => {
                        // Proceed with making the API request
                        const filterQuery = constructFilterQuery(
                          selectedAreaOptions,
                          selectedCategoriaOptions,
                          selectedSubcategoriaOptions,
                          userEntries
                        );

                        makeApiRequestGpt(question, filterQuery, includeHistory);
                      }}
                    />
                    </div>
                </div>

                {answers.length > 0 && activeAnalysisPanelTab && (
                    <AnalysisPanel
                        className={styles.chatAnalysisPanel}
                        activeCitation={activeCitation}
                        onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
                        citationHeight="810px"
                        answer={answers[selectedAnswer][1]}
                        activeTab={activeAnalysisPanelTab}
                    />
                )}

                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                >
                    <TextField
                        className={styles.chatSettingsSeparator}
                        defaultValue={promptTemplate}
                        label="Override prompt template"
                        multiline
                        autoAdjustHeight
                        onChange={onPromptTemplateChange}
                    />

                    <SpinButton
                        className={styles.chatSettingsSeparator}
                        label="Retrieve this many documents from search:"
                        min={1}
                        max={50}
                        defaultValue={retrieveCount.toString()}
                        onChange={onRetrieveCountChange}
                    />
                    <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticRanker}
                        label="Use semantic ranker for retrieval"
                        onChange={onUseSemanticRankerChange}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticCaptions}
                        label="Use query-contextual summaries instead of whole documents"
                        onChange={onUseSemanticCaptionsChange}
                        disabled={!useSemanticRanker}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSuggestFollowupQuestions}
                        label="Suggest follow-up questions"
                        onChange={onUseSuggestFollowupQuestionsChange}
                    />
                </Panel>
            </div>
        </div>
    );
};

export default Chat;