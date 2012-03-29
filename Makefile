TESTDIR := tests
REF_TARGET := $(TESTDIR)/ref/ref.out
REF_SOURCE := $(TESTDIR)/ref/*.cc
CXX := g++
CXX_FLAGS := -Wall -lm -lsndfile

$(REF_TARGET): $(REF_SOURCE)
	$(CXX) $(CXX_FLAGS) $^ -o $@

%.data: $(REF_TARGET) %.wav
	$^ $@

clean:
	rm -rf $(REF_TARGET)

.PHONY: clean
