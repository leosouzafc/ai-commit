type ApiResponse = ApiErrorResponse | ApiSuccessResponse;

type ApiSuccessResponse = {
  choices: {
    content_filter_results: {
      hate: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
      self_harm: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
      sexual: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
      violence: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
    };
    finish_reason: "stop" | "length" | "content_filter" | string;
    index: number;
    logprobs: null | {
      tokens: string[];
      token_logprobs: number[];
      top_logprobs: Record<string, number>[];
      text_offset: number[];
    };
    message: {
      content: string;
      refusal: null | string;
      role: "assistant" | "user" | "system";
    };
  }[];
  created: number;
  id: string;
  model: string;
  object: string;
  prompt_filter_results: {
    prompt_index: number;
    content_filter_results: {
      hate: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
      jailbreak: {
        filtered: boolean;
        detected: boolean;
      };
      self_harm: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
      sexual: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
      violence: {
        filtered: boolean;
        severity: "safe" | "low" | "medium" | "high";
      };
    };
  }[];
  system_fingerprint: string;
  usage: {
    completion_tokens: number;
    completion_tokens_details: {
      accepted_prediction_tokens: number;
      audio_tokens: number;
      reasoning_tokens: number;
      rejected_prediction_tokens: number;
    };
    prompt_tokens: number;
    prompt_tokens_details: {
      audio_tokens: number;
      cached_tokens: number;
    };
    total_tokens: number;
  };
};

type ApiErrorResponse = {
  detail: string;
};

export { ApiResponse, ApiErrorResponse, ApiSuccessResponse };
