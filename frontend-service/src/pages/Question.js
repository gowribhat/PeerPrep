import axios from "axios";
import * as DOMPurify from "dompurify";
import * as marked from "marked";
import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";


import { useUser } from "../contexts/UserContext";

import Page from "../components/Page";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Button from '@mui/material/Button';
import AcknowledgementToast from "../components/AcknowledgementToast";

marked.use({ breaks: true, gfm: true, silent: true });

const getDifficultyChipColor = (difficulty) => {
  switch (difficulty) {
    case "easy":
      return "success";
    case "medium":
      return "warning";
    case "hard":
      return "error";
    default:
      return "primary";
  }
};

const Question = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const historyCode = location.state ? location.state.code : null;
  const historyLanguage = location.state ? location.state.language : null;

  const { id } = useParams();
  const user = useUser();
  const editorRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [editorLanguage, setEditorLanguage] = useState(historyLanguage? historyLanguage : "javascript");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastOpen, setIsToastOpen] = useState(false);
 
  useEffect(() => {
    const getQuestion = async () => {
      const url = `${process.env.REACT_APP_QUESTIONS_SERVICE_HOST}/questions/${id}`;
      const token = window.localStorage.getItem("token");
      const header = {
        headers: { Authorization: token },
      };
      const response = await axios.get(url, header);
      const question = response.data;
      if (!question.question_id) return navigate("/questions");
      setQuestion(question);
      setIsLoading(false);
    };

    getQuestion();
  }, [id, navigate]);

  useEffect(() => {
    editorRef.current?.focus();
  }, [editorLanguage]);
  const handleEditorLanguageChange = (event) => setEditorLanguage(event.target.value);
  
  const handleSubmitClick = async () => {
    try {
      const token = window.localStorage.getItem("token");
      const config = {headers: { Authorization: token }};
      const {question_id} = question;
      const attempt = editorRef.current.getValue();

      // if doing with partner, put partner's user id
      // if doing solo, put null
      // const partner_id = null;
      const partner_id = "84834d46-76dd-4224-ac08-57e146244f68";

      const language = editorLanguage;

      const history_url = `${process.env.REACT_APP_HISTORY_SERVICE_HOST}/addHistory`; 
      await axios.post(history_url, { question_id, attempt, language, partner_id }, config);
      setToastMessage("Submitted succesfully!");
      setIsToastOpen(true);
    } catch (error) {
      console.error(error);
    }
  }

  if (isLoading) return <LinearProgress variant="indeterminate" />;

  return (
    <Page title="Question">
      <AcknowledgementToast
        message={toastMessage}
        open={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        severity="success"
      />
      <Box height="calc(100vh - 64px)" width="100vw" >
        <Box height="100%" display="flex">
          <Box width="50%" height="100%" padding={1}>
            <Stack height="100%" spacing={1}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Tooltip title="Back to questions" placement="top" arrow>
                  <IconButton onClick={() => navigate("/questions")}>
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <Typography
                  variant="h5"
                  flexGrow={1}
                  noWrap
                  textOverflow="ellipsis"
                >
                  {question.title}
                </Typography>
                <Chip
                  label={question.complexity.charAt(0).toUpperCase() + question.complexity.substring(1)}
                  color= {getDifficultyChipColor(question.complexity)}
                  size="small"
                  sx={{ color: "white" }}
                />
                {user.isMaintainer && (
                  <Tooltip title="Edit question" placement="top" arrow>
                    <IconButton
                      onClick={() => navigate(`/questions/${id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Box>
                {question.categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    size="small"
                    sx={{ marginRight: 1 }}
                  />
                ))}
              </Box>
              <Card variant="outlined" sx={{ flexGrow: 1, padding: 1, backgroundColor: "white" }}>
                <iframe
                  height="100%"
                  width="100%"
                  style={{ border: "none" }}
                  sandbox=""
                  title="Question Description"
                  srcDoc={DOMPurify.sanitize(
                    marked.parse(question.description)
                  )}
                />
              </Card>
            </Stack>
          </Box>
          <Box width="50%" height="100%" padding={1}>
            <Paper
              sx={{ height: "100%", width: "100%", overflow: "hidden" }}
              elevation={2}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" px={1}>
                <Stack direction="row" alignItems="center">
                  <Typography>Editor Language:</Typography>
                  <Select
                    value={editorLanguage}
                    onChange={handleEditorLanguageChange}
                    sx={{height: 20, width: 130,m: 1}}
                  >
                    <MenuItem value="javascript">Javascript</MenuItem>
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="java">Java</MenuItem>
                  </Select>
                </Stack>
                <Button variant="contained" onClick={handleSubmitClick}>Submit</Button>
              </Stack>
              <Editor
                language={editorLanguage}
                value={    
                  historyCode && editorLanguage == historyLanguage
                  ? historyCode
                  : editorLanguage == "python"
                  ? "# Insert your code here\n"
                  : "// Insert your code here\n"
                }
                theme="vs-dark"
                onMount={(editor) => {
                  editorRef.current = editor;
                  editorRef.current.focus();
                }}
              />
            </Paper>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default Question;
