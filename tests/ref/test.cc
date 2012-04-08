#include "pitch.hh"
#include <stdio.h>
#include <iostream>
#include <sndfile.h>
#include <string.h>

#define BUFFER_LEN 1024
#define DEBUG(...) { fprintf(stderr, __VA_ARGS__); fprintf(stderr, "\n"); }
#define ERROR(...) { fprintf(stderr, "ERROR: "); fprintf(stderr, __VA_ARGS__); fprintf(stderr, "\n"); }

typedef enum {
	REF_NO_ERROR,
	REF_ERROR_INVALID_ARGUMENTS,
	REF_ERROR_STATE_ALLOCATION,
	REF_ERROR_FILE_READ,
	REF_ERROR_FILE_WRITE,
	REF_ERROR_NOT_MONO,
} ref_test_error;

typedef struct {
	FILE *outfile;
	Analyzer *analyzer;
} ref_state;

using namespace std;

void process_data (double *data, int count, ref_state *state) ;

int main (int argc, char *argv[]) {
	if (argc != 3) {
		DEBUG("Usage: ./ref.out <inputfile> <outputfile>")
		return REF_NO_ERROR;
	}

	char *inpath = argv[1];
	char *outpath = argv[2];

	double data [BUFFER_LEN];

	SNDFILE *infile;
	FILE *outfile;

	SF_INFO sfinfo;
	int readcount;
	ref_state *state;

	DEBUG("Generating test file `%s` from input data in `%s`",
		outpath, inpath)

	/*
		Preparations:
		 * allocate state
		 * open files
		 * check for data validity
		 * initialize Analyzer
	*/

	state = (ref_state*) malloc(sizeof(*state));
	if (state == NULL) {
		ERROR("Failed to allocate state")

		return REF_ERROR_STATE_ALLOCATION;
	}

	infile = sf_open(inpath, SFM_READ, &sfinfo);

	if (infile == NULL) {
		ERROR("Failed to open input file `%s`", inpath)

		return REF_ERROR_FILE_READ;
	}

	if (sfinfo.channels != 1) {
		ERROR("Input file `%s` is not mono (has %d channels)",
			inpath, sfinfo.channels)

		return REF_ERROR_NOT_MONO;
	}

	if (strcmp(outpath, "-")) {
		outfile = fopen(outpath, "w+");

		if (outfile == NULL) {
			ERROR("Failed to open output file `%s` for writing",
				outpath)

			return REF_ERROR_FILE_WRITE;
		}
	} else {
		outfile = stdout;
	}

	state->outfile = outfile;

	state->analyzer = new Analyzer(sfinfo.samplerate, "ref_tester");

	/* Let the magic begin */

	while ((readcount = sf_read_double (infile, data, BUFFER_LEN))) {
		process_data(data, readcount, state);
	}

	/* "Always close the files you have opened" yeah yeah... */

	sf_close(infile);
	fclose(outfile);

	/* Let's get outta here */

	DEBUG("Done")
	
	return REF_NO_ERROR;
}

void process_data (double *data, int count, ref_state *state) {
	Analyzer *analyzer = state->analyzer;

	analyzer->input<double*>(data, data + count);
	analyzer->process();
	Tone const *tone = analyzer->findTone();

	double freq = tone ? tone->freq : 0.0;

	fprintf(state->outfile, "%f\n", freq);
}
